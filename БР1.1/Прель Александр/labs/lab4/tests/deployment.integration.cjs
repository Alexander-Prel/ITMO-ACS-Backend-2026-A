const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { root, binary, readConfig, composeArgs, childEnv } = require('../scripts/config.cjs');

const execute = promisify(execFile);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'itmo-lab4-test-'));
const file = path.join(directory, '.env.compose');
const applicationServices = ['accounts', 'catalog', 'bookings', 'notifications', 'gateway'];
let config;
let ownsProject = false;
let token;
let user;
let reservation;

async function docker(args) {
  const result = await execute(binary, args, {
    cwd: root,
    env: childEnv(config),
    timeout: 180000,
    maxBuffer: 2 * 1024 * 1024,
  });
  return result.stdout.trim();
}

const compose = args => docker([...composeArgs(config, file), ...args]);

async function request(route, { method = 'GET', body, auth = token } = {}) {
  const response = await fetch(`http://127.0.0.1:${config.PUBLIC_PORT}${route}`, {
    method,
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  const source = readConfig();
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));

  config = {
    COMPOSE_PROJECT_NAME: `itmo-lab4-test-${randomBytes(6).toString('hex')}`,
    IMAGE_PREFIX: source.IMAGE_PREFIX,
    BIND_ADDRESS: '127.0.0.1',
    PUBLIC_PORT: String(port),
    JWT_SECRET: randomBytes(32).toString('hex'),
    SERVICE_KEY: randomBytes(32).toString('hex'),
    RABBITMQ_PASSWORD: randomBytes(24).toString('hex'),
  };
  fs.writeFileSync(file, Object.entries(config).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', {
    flag: 'wx',
    mode: 0o600,
  });
  readConfig(file);
  assert.equal(await docker(['ps', '-aq', '--filter', `label=com.docker.compose.project=${config.COMPOSE_PROJECT_NAME}`]), '');
  ownsProject = true;
  await compose(['up', '-d', '--no-build', '--wait', '--wait-timeout', '120']);
});

after(async () => {
  try {
    if (ownsProject) await compose(['down', '--volumes', '--timeout', '15']);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('only Nginx publishes a loopback port and the backend network remains private', async () => {
  assert.equal(await docker(['network', 'inspect', `${config.COMPOSE_PROJECT_NAME}_backend`, '--format', '{{.Internal}}']), 'true');
  assert.equal(await docker(['network', 'inspect', `${config.COMPOSE_PROJECT_NAME}_edge`, '--format', '{{.Internal}}']), 'false');

  for (const service of [...applicationServices, 'rabbitmq', 'proxy']) {
    const id = await compose(['ps', '-q', service]);
    const info = JSON.parse(await docker([
      'inspect',
      '--format',
      '{"ports":{{json .HostConfig.PortBindings}},"restart":{{json .HostConfig.RestartPolicy.Name}},"readonly":{{json .HostConfig.ReadonlyRootfs}},"user":{{json .Config.User}}}',
      id,
    ]));
    assert.equal(info.restart, 'unless-stopped');
    if (service === 'proxy') {
      assert.deepEqual(info.ports['8080/tcp'], [{ HostIp: '127.0.0.1', HostPort: config.PUBLIC_PORT }]);
      assert.equal(info.readonly, true);
      assert.equal(info.user, '101:101');
    } else {
      assert.equal(Object.keys(info.ports ?? {}).length, 0);
    }
  }
});

test('Nginx serves health checks and the complete user booking flow', async () => {
  assert.deepEqual(await request('/proxy-health'), { status: 200, body: { status: 'ok', component: 'nginx' } });
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request('/ready')).status, 200);
  assert.equal((await request('/')).status, 404);
  assert.equal((await request('/users/me', { auth: null })).status, 401);

  const suffix = randomBytes(5).toString('hex');
  const registered = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Deploy',
      lastName: 'Test',
      email: `deploy-${suffix}@example.com`,
      phone: `+7999${String(Date.now()).slice(-7)}`,
      password: 'StrongPass123',
    },
  });
  assert.equal(registered.status, 201);
  token = registered.body.accessToken;
  user = registered.body.user;

  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: user.email, password: 'StrongPass123' },
    auth: null,
  });
  assert.equal(login.status, 200);
  assert.equal((await request('/users/me')).body.userId, user.userId);
  assert.equal((await request('/restaurants')).status, 200);

  const created = await request('/reservations', {
    method: 'POST',
    body: {
      restaurantId: 1,
      reservationDate: '2034-04-10',
      startTime: '18:00:00',
      endTime: '20:00:00',
      guestsCount: 4,
    },
  });
  assert.equal(created.status, 201);
  reservation = created.body;
});

test('manual redeployment recreates containers without losing application data', async () => {
  const previousGateway = await compose(['ps', '-q', 'gateway']);
  await compose([
    'up', '-d', '--no-build', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '120',
    ...applicationServices, 'proxy',
  ]);
  assert.notEqual(await compose(['ps', '-q', 'gateway']), previousGateway);
  assert.equal((await request('/ready')).status, 200);
  assert.equal((await request('/users/me')).body.userId, user.userId);
  assert.equal((await request(`/reservations/${reservation.reservationId}`)).body.status, 'confirmed');

  const cancelled = await request(`/reservations/${reservation.reservationId}/cancel`, { method: 'PATCH', body: {} });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.status, 'cancelled');
});
