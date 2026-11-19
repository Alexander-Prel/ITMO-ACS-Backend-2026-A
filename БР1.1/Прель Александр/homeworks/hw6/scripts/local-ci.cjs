const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../../../..');
const directories = {
  lab2: path.join(root, 'БР1.1/Прель Александр/labs/lab2'),
  lab3: path.join(root, 'БР1.1/Прель Александр/labs/lab3'),
  lab4: path.join(root, 'БР1.1/Прель Александр/labs/lab4'),
};

const steps = [
  ['lab2', ['ci', '--include=dev']],
  ['lab2', ['run', 'typecheck']],
  ['lab2', ['run', 'build']],
  ['lab2', ['test']],
  ['lab2', ['audit', '--omit=dev']],
  ['lab2', ['ci', '--include=dev']],
  ['lab2', ['run', 'test:messaging']],
  ['lab3', ['run', 'setup']],
  ['lab3', ['run', 'config:check']],
  ['lab3', ['run', 'build']],
  ['lab3', ['test']],
  ['lab4', ['run', 'setup']],
  ['lab4', ['run', 'config:check']],
  ['lab4', ['run', 'build']],
  ['lab4', ['start']],
  ['lab4', ['test']],
  ['lab4', ['run', 'test:smoke']],
  ['lab4', ['run', 'test:postman']],
];

function main() {
  for (const [name, args] of steps) {
    console.log(`\n=== ${name}: npm ${args.join(' ')} ===`);
    const result = spawnSync('npm', args, { cwd: directories[name], stdio: 'inherit', env: process.env });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }

  console.log('\nLocal CI reproduction completed successfully.');
}

if (require.main === module) main();

module.exports = { steps };
