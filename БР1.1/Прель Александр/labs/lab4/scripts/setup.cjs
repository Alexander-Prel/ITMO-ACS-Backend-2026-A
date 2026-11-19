const fs = require('node:fs');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const { configPath } = require('./config.cjs');

async function isFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}

async function main() {
  if (fs.existsSync(configPath)) {
    console.log('.env.compose exists; preserved.');
    return;
  }

  let port;
  for (let candidate = 8200; candidate < 8300; candidate++) {
    if (await isFree(candidate)) {
      port = candidate;
      break;
    }
  }
  if (!port) throw new Error('No free local port found in the 8200-8299 range');

  const project = `itmo-lab4-${randomBytes(6).toString('hex')}`;
  const values = {
    COMPOSE_PROJECT_NAME: project,
    IMAGE_PREFIX: project,
    BIND_ADDRESS: '127.0.0.1',
    PUBLIC_PORT: port,
    JWT_SECRET: randomBytes(32).toString('hex'),
    SERVICE_KEY: randomBytes(32).toString('hex'),
    RABBITMQ_PASSWORD: randomBytes(24).toString('hex'),
  };
  fs.writeFileSync(configPath, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', {
    flag: 'wx',
    mode: 0o600,
  });
  console.log(`Created isolated local deployment. API: http://127.0.0.1:${port}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
