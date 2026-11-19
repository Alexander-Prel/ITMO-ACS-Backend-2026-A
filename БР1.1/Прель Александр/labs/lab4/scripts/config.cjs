const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, '.env.compose');
const bundled = '/Applications/Docker.app/Contents/Resources/bin';
const binary = fs.existsSync(`${bundled}/docker`) ? `${bundled}/docker` : 'docker';

function readConfig(file = configPath) {
  if (!fs.existsSync(file)) throw new Error('Missing .env.compose; run npm run setup');
  const config = parseEnv(fs.readFileSync(file, 'utf8'));
  if (!/^itmo-lab4-(?:test-)?[a-f0-9]{12}$/.test(config.COMPOSE_PROJECT_NAME ?? '')) throw new Error('Unexpected Compose project name');
  if (!/^itmo-lab4-[a-f0-9]{12}$/.test(config.IMAGE_PREFIX ?? '')) throw new Error('Invalid image prefix');
  if (config.BIND_ADDRESS !== '127.0.0.1') throw new Error('BIND_ADDRESS must stay 127.0.0.1 for the local-only lab');
  if (!/^\d+$/.test(config.PUBLIC_PORT ?? '') || Number(config.PUBLIC_PORT) < 1024 || Number(config.PUBLIC_PORT) > 65535) {
    throw new Error('Invalid PUBLIC_PORT');
  }
  for (const key of ['JWT_SECRET', 'SERVICE_KEY', 'RABBITMQ_PASSWORD']) {
    if (!/^[a-f0-9]{48,64}$/.test(config[key] ?? '')) throw new Error(`Invalid generated ${key}`);
  }
  return config;
}

function composeArgs(config, file = configPath) {
  return ['compose', '--project-name', config.COMPOSE_PROJECT_NAME, '--env-file', file, '-f', path.join(root, 'docker-compose.yml')];
}

const childEnv = config => ({ ...process.env, ...config, PATH: `${bundled}:${process.env.PATH}` });

module.exports = { root, configPath, binary, readConfig, composeArgs, childEnv };
