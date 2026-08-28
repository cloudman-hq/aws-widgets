import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Forge workspace exposes the isolated app contract', async () => {
  const [manifest, packageJson, tsconfig] = await Promise.all([
    read('manifest.yml'),
    read('package.json').then(JSON.parse),
    read('tsconfig.json').then(JSON.parse),
  ]);

  assert.match(manifest, /^ {2}macro:/m);
  assert.match(manifest, /- key: aws-widget-macro/);
  assert.match(manifest, /confluence:globalSettings:/);
  assert.match(manifest, /handler: resolver\/index\.handler/);
  assert.match(manifest, /name: nodejs24\.x/);
  assert.match(manifest, /- storage:app/);
  assert.match(manifest, /- read:confluence-content\.all/);
  assert.match(manifest, /- read:app-data:confluence/);
  assert.match(manifest, /key: CONNECT_KEY\n\s+default: com\.aws\.widget\.confluence-addon/);
  assert.match(manifest, /connect:\n\s+key: \$\{CONNECT_KEY\}/);
  assert.match(manifest, /- '\*\.amazonaws\.com'/);
  assert.match(manifest, /- '\*\.amazonaws\.com\.cn'/);
  assert.doesNotMatch(manifest, /^remotes:/m);
  assert.doesNotMatch(manifest, /^\s+client:/m);

  for (const script of ['lint', 'typecheck', 'unit', 'build', 'forge:lint', 'verify']) {
    assert.equal(typeof packageJson.scripts[script], 'string', `missing ${script} script`);
  }
  assert.equal(packageJson.engines.node, '>=24 <25');
  assert.equal(tsconfig.compilerOptions.noEmit, false, 'Forge ts-loader requires emitted output');
});

test('Forge backend imports are compatible with the deployment bundler', async () => {
  const resolverDirectory = new URL('../src/resolver/', import.meta.url);
  const files = (await readdir(resolverDirectory, { recursive: true }))
    .filter((file) => file.endsWith('.ts'));
  const sources = await Promise.all(
    files.map((file) => readFile(new URL(file, resolverDirectory), 'utf8')),
  );

  for (const [index, source] of sources.entries()) {
    assert.doesNotMatch(
      source,
      /from ['"][^'"]+\.js['"]/,
      `${files[index]} uses a .js specifier that Forge webpack cannot resolve to TypeScript`,
    );
  }
});

test('legacy TypeScript build excludes the independent Forge workspace', async () => {
  const rootTsconfig = await read('../tsconfig.json').then(JSON.parse);
  const excluded = rootTsconfig.exclude ?? [];

  assert.ok(
    excluded.some((entry) => entry === 'forge' || entry.startsWith('forge/')),
    'root tsconfig must exclude forge or the legacy build type-checks Forge without its dependencies',
  );
});
