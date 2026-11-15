import { defineConfig } from 'tsdown';

const common = {
  entry: { 'react-beautiful-dnd': 'src/index.ts' },
  dts: true,
  outDir: 'dist',
  target: 'chrome75',
  outExtensions: ({ format }: { format: string }) => ({
    js: format === 'cjs' ? '.cjs.js' : '.esm.js',
    dts: '.d.ts',
  }),
} as const;

// cjs는 tsdown이 항상 Node.js 대상으로 빌드한다. platform: 'browser'를 주면
// 0.23부터 경고가 나오므로 포맷별로 나눈다. esm만 browser를 유지해야 산출물이
// 기존과 같다(platform 변경 시 process.env.NODE_ENV 분기가 esm에 추가된다).
// clean은 첫 번째 설정에서만 true로 둔다. 둘 다 true면 서로 산출물을 지운다.
export default defineConfig([
  { ...common, format: ['esm'], platform: 'browser', clean: true },
  { ...common, format: ['cjs'], platform: 'node', clean: false },
]);
