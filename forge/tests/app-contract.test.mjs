import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Forge workspace exposes the isolated app contract', async () => {
  const [manifest, packageJson] = await Promise.all([
    read('manifest.yml'),
    read('package.json').then(JSON.parse),
  ]);

  assert.match(manifest, /^ {2}macro:/m);
  assert.match(manifest, /- key: aws-widget-macro/);
  assert.match(manifest, /confluence:globalSettings:/);
  assert.match(manifest, /handler: resolver\/index\.handler/);
  assert.match(manifest, /name: nodejs24\.x/);
  assert.match(manifest, /- storage:app/);
  assert.match(manifest, /- '\*\.amazonaws\.com'/);
  assert.match(manifest, /- '\*\.amazonaws\.com\.cn'/);
  assert.doesNotMatch(manifest, /^remotes:/m);
  assert.doesNotMatch(manifest, /^\s+client:/m);

  for (const script of ['lint', 'typecheck', 'unit', 'build', 'forge:lint', 'verify']) {
    assert.equal(typeof packageJson.scripts[script], 'string', `missing ${script} script`);
  }
  assert.equal(packageJson.engines.node, '>=24 <25');
});
