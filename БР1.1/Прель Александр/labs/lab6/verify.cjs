const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

const url = 'http://127.0.0.1:3300';
const password = process.env.GRAFANA_PASSWORD;
if (!password) throw new Error('GRAFANA_PASSWORD required');
const headers = { authorization: 'Basic ' + Buffer.from('admin:' + password).toString('base64') };

async function query(source, expression, suffix = 'query') {
  const route = source === 'prom' ? '/api/v1/' : '/loki/api/v1/';
  const response = await fetch(url + '/api/datasources/proxy/uid/' + source + route + suffix + '?query=' + encodeURIComponent(expression), {
    headers, signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Datasource HTTP ' + response.status);
  return response.json();
}

async function main() {
  let lastError;
  for (let attempt = 0; attempt < 36; attempt++) {
    try {
      const health = await query('prom', 'probe_success{job="booking-health"}');
      const resources = await query('prom', 'node_memory_MemTotal_bytes');
      const logs = await query('logs', 'count_over_time({job="docker"}[15m])');
      if (health.data.result.length !== 5 || health.data.result.some(item => Number(item.value[1]) !== 1)) {
        throw new Error('Five healthy microservice targets required');
      }
      if (!resources.data.result.some(item => Number(item.value[1]) > 0)) throw new Error('VM memory metric missing');
      if (!logs.data.result.length) throw new Error('Docker logs missing');
      const config = fs.readFileSync(process.env.APP_ENV || '/opt/itmo-booking/shared/.env.compose', 'utf8');
      const project = config.match(/^COMPOSE_PROJECT_NAME=([a-zA-Z0-9_-]+)$/m)?.[1];
      if (!project) throw new Error('Application project missing');
      const containers = execFileSync('docker', ['ps', '--filter', 'label=com.docker.compose.project=' + project, '--format', '{{.ID}}'], {encoding:'utf8'}).trim().split('\n');
      if (containers.length !== 7 || containers.some(id => !logs.data.result.some(item => item.metric.container?.startsWith(id)))) {
        throw new Error('Log streams for all seven application containers required');
      }
      const definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'grafana/dashboards/booking.json'), 'utf8'));
      const panels = [];
      for (const panel of definition.panels.filter(item => item.id <= 4)) {
        for (const target of panel.targets) {
          const metric = await query('prom', target.expr);
          if (!metric.data.result.length || metric.data.result.some(item => !Number.isFinite(Number(item.value[1])))) {
            throw new Error('Resource panel missing: ' + panel.title);
          }
          panels.push({title:panel.title, query:target.expr, samples:metric.data.result});
        }
      }
      const dashboard = await fetch(url + '/api/dashboards/uid/booking-vm', {headers});
      if (!dashboard.ok) throw new Error('Provisioned dashboard missing');
      const result = {
        utc: new Date().toISOString(),
        environment: 'GitHub Actions Ubuntu runner, ephemeral Linux VM',
        health: health.data.result.map(item => ({instance:item.metric.instance, value:Number(item.value[1])})),
        memoryBytes: Number(resources.data.result[0].value[1]),
        logStreamCount: logs.data.result.length,
        applicationContainersWithLogs: containers.length,
        resourcePanels: panels,
        dashboardUid: 'booking-vm',
      };
      const destination = process.env.MONITOR_EVIDENCE || 'monitor-evidence.json';
      fs.mkdirSync(path.dirname(destination), {recursive:true});
      fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
      console.log('Grafana verified: 5 healthy services; CPU, RAM, disk, RX/TX; logs from 7 application containers; provisioned dashboard.');
      console.log(JSON.stringify(result));
      return;
    } catch (error) { lastError = error; await delay(5000); }
  }
  throw lastError;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
