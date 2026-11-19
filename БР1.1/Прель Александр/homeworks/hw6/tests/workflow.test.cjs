const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../../../..');
const workflowPath = path.join(root, '.github/workflows/backend-ci-cd.yml');
const deployScriptPath = path.join(__dirname, '../scripts/remote-deploy.sh');
const localCiPath = path.join(__dirname, '../scripts/local-ci.cjs');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const { steps: localCiSteps } = require(localCiPath);

function runDeployValidator(functionName, value) {
  return spawnSync('bash', ['-c', 'source "$1"; "$2" "$3"', 'hw6-test', deployScriptPath, functionName, value], {
    encoding: 'utf8',
  });
}

test('workflow is valid YAML and remote deployment script is valid Bash', () => {
  const yaml = spawnSync('ruby', ['-e', "require 'yaml'; YAML.load_file(ARGV.fetch(0))", workflowPath]);
  assert.equal(yaml.status, 0, yaml.stderr.toString());
  const shell = spawnSync('bash', ['-n', deployScriptPath]);
  assert.equal(shell.status, 0, shell.stderr.toString());
});

test('CI covers locked install, build, tests, messaging and Compose', () => {
  for (const command of [
    'npm ci --include=dev',
    'npm run typecheck',
    'npm run build',
    'npm test',
    'npm audit --omit=dev',
    'npm run test:messaging',
    'npm run test:postman',
  ]) assert.match(workflow, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(workflow, /needs: \[quality, messaging\]/);
  assert.match(workflow, /contents: read/);
});

test('deployment is gated and SSH host verification cannot be bypassed', () => {
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/semester-2-practice'/);
  assert.match(workflow, /vars\.ENABLE_REMOTE_DEPLOY == 'true'/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /DEPLOY_KNOWN_HOSTS/);
  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /StrictHostKeyChecking\s*=\s*no/);
  assert.match(workflow, /source "\$HW6_DIR\/scripts\/remote-deploy\.sh"/);
  assert.match(workflow, /is_safe_absolute_path "\$DEPLOY_PATH"/);
  assert.match(workflow, /is_valid_port "\$DEPLOY_PORT"/);
});

test('only commit-pinned official GitHub actions are referenced', () => {
  const actions = [...workflow.matchAll(/^\s*uses:\s*([^\s]+)(?:\s+#.*)?$/gm)].map(match => match[1]);
  assert.ok(actions.length >= 5);
  assert.deepEqual(new Set(actions), new Set([
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  ]));
  for (const action of actions) assert.match(action, /@[a-f0-9]{40}$/);
});

test('local CI reproduces setup and command order from the workflow', () => {
  assert.deepEqual(localCiSteps, [
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
  ]);
});

test('remote deployment accepts only normalized absolute paths', () => {
  for (const value of ['/opt/itmo-booking', '/srv/releases/app_1', '/Users/deploy/.local/app']) {
    assert.equal(runDeployValidator('is_safe_absolute_path', value).status, 0, value);
  }
  for (const value of ['relative/path', '/', '/opt/../root', '/opt/./app', '/opt//app', '/opt/app/']) {
    assert.notEqual(runDeployValidator('is_safe_absolute_path', value).status, 0, value);
  }
});

test('remote deployment restricts ports to 1 through 65535', () => {
  for (const value of ['1', '22', '8200', '65535']) {
    assert.equal(runDeployValidator('is_valid_port', value).status, 0, value);
  }
  for (const value of ['', '0', '-1', '65536', '999999', '8200x']) {
    assert.notEqual(runDeployValidator('is_valid_port', value).status, 0, value);
  }
});
