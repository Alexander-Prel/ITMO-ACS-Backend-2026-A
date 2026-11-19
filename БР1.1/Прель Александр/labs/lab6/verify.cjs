const fs = require('node:fs');
const path = require('node:path');
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
      const logs = await query('logs', '{job="docker"}', 'query_range');
      if (health.data.result.length !== 5 || health.data.result.some(item => Number(item.value[1]) !== 1)) {
        throw new Error('Five healthy microservice targets required');
      }
      if (!resources.data.result.some(item => Number(item.value[1]) > 0)) throw new Error('VM memory metric missing');
      if (!logs.data.result.some(item => item.values.length > 0)) throw new Error('Docker logs missing');
      const dashboard = await fetch(url + '/api/dashboards/uid/booking-vm', {headers});
      if (!dashboard.ok) throw new Error('Provisioned dashboard missing');
      const result = {
        utc: new Date().toISOString(),
        environment: 'GitHub Actions Ubuntu runner, ephemeral Linux VM',
        health: health.data.result.map(item => ({instance:item.metric.instance, value:Number(item.value[1])})),
        memoryBytes: Number(resources.data.result[0].value[1]),
        logStreamCount: logs.data.result.length,
        dashboardUid: 'booking-vm',
      };
      const destination = process.env.MONITOR_EVIDENCE || 'monitor-evidence.json';
      fs.mkdirSync(path.dirname(destination), {recursive:true});
      fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
      console.log('Grafana verified: 5 healthy services, VM resources, Docker log streams and provisioned dashboard.');
      return;
    } catch (error) { lastError = error; await delay(5000); }
  }
  throw lastError;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
