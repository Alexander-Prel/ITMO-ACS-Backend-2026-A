const path = require('node:path');
const { spawn } = require('node:child_process');
const { root, binary, readConfig, composeArgs, childEnv } = require('./config.cjs');

try {
  const config = readConfig();
  const child = spawn(binary, [...composeArgs(config), ...process.argv.slice(2)], {
    // Bake reads sibling production Dockerfiles under the common labs directory.
    cwd: path.dirname(root),
    env: childEnv(config),
    stdio: 'inherit',
  });
  child.on('error', error => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on('exit', code => {
    process.exitCode = code ?? 1;
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
