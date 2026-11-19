const { spawnSync } = require('node:child_process');
const { root, binary, readConfig, composeArgs, childEnv } = require('./config.cjs');

function run(config, args) {
  const result = spawnSync(binary, [...composeArgs(config), ...args], {
    cwd: root,
    env: childEnv(config),
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`docker compose ${args[0]} failed with exit code ${result.status}`);
}

try {
  const config = readConfig();
  run(config, ['config', '--quiet']);
  run(config, ['up', '--detach', '--wait', '--wait-timeout', '120']);
  console.log(`Deployment is ready at http://${config.BIND_ADDRESS}:${config.PUBLIC_PORT}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
