import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { 'react-beautiful-dnd': 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  platform: 'browser',
  target: 'chrome75',
  clean: true,
  outExtensions: ({ format }) => ({
    js: format === 'cjs' ? '.cjs.js' : '.esm.js',
    dts: '.d.ts',
  }),
});
