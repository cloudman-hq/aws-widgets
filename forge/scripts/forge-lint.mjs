import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync('forge', ['lint'], {
  encoding: 'utf8',
  env: process.env,
  shell: process.platform === 'win32',
});

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
if (result.error) {
  throw result.error;
}

// Forge CLI 13.4.0 can print an authentication Error while exiting zero.
// Never let aggregate verification report that as a successful lint.
if ((result.status ?? 1) !== 0 || /(^|\n)Error:/m.test(output)) {
  process.exitCode = result.status && result.status !== 0 ? result.status : 1;
}
