/**
 * @jest-environment node
 */
import child from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import pkg from '../../../package.json';

const exec = promisify(child.exec);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

jest.setTimeout(120 * 1000);

beforeAll(async () => {
  await exec('pnpm build');
});

afterAll(async () => {
  await exec('pnpm build:clean');
});

it('publishes the scoped ESM and CJS package without Babel runtime', async () => {
  expect(pkg.name).toBe('@cp949/react-beautiful-dnd');
  expect(pkg.dependencies).not.toHaveProperty('@babel/runtime');
  expect(pkg.peerDependencies).toEqual({
    react: '^18.0.0 || ^19.0.0',
    'react-dom': '^18.0.0 || ^19.0.0',
  });

  const distDirectory = path.resolve(__dirname, '../../../dist');
  const esmPath = path.join(distDirectory, 'dnd.esm.js');
  const cjsPath = path.join(distDirectory, 'dnd.cjs.js');

  expect(await exists(esmPath)).toBe(true);
  expect(await exists(cjsPath)).toBe(true);
  expect(await exists(path.join(distDirectory, 'dnd.js'))).toBe(false);
  expect(await exists(path.join(distDirectory, 'dnd.min.js'))).toBe(false);

  const contents = `${await readFile(esmPath, 'utf8')}\n${await readFile(
    cjsPath,
    'utf8',
  )}`;

  expect(contents).not.toContain('@babel/runtime');
  expect(contents).not.toContain('regenerator-runtime');
});
