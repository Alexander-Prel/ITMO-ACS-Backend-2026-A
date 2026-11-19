const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../../../..');
const workflow = path.join(root, '.github/workflows/backend-ci-cd.yml');
const remoteScript = path.join(__dirname, 'remote-deploy.sh');

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout).trim());
}

run('ruby', ['-e', "require 'yaml'; YAML.load_file(ARGV.fetch(0)); puts 'YAML syntax: OK'", workflow]);
run('bash', ['-n', remoteScript]);

const text = fs.readFileSync(workflow, 'utf8');
const required = [
  'pull_request:',
  'branches: [semester-2-practice]',
  'permissions:\n  contents: read',
  'needs: [quality, messaging]',
  "github.ref == 'refs/heads/semester-2-practice'",
  "vars.ENABLE_REMOTE_DEPLOY == 'true'",
  'environment: production',
  'DEPLOY_KNOWN_HOSTS',
  'npm audit --omit=dev',
  'npm run test:messaging',
  'npm run test:postman',
];
for (const value of required) {
  if (!text.includes(value)) throw new Error(`Workflow requirement is missing: ${value}`);
}
if (text.includes('pull_request_target:')) throw new Error('pull_request_target must not be used with repository code');
if (/StrictHostKeyChecking\s*=\s*no/.test(text)) throw new Error('SSH host verification must not be disabled');

const actions = [...text.matchAll(/^\s*uses:\s*([^\s]+)(?:\s+#.*)?$/gm)].map(match => match[1]);
const allowed = new Set([
  'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
  'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
]);
for (const action of actions) {
  if (!allowed.has(action)) throw new Error(`Unexpected third-party action: ${action}`);
}

console.log('Workflow structure: OK');
console.log('Remote deploy shell syntax: OK');
