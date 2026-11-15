import path from 'node:path';
import { defineConfig } from 'vitest/config';

const reactMajorVersion = process.env.REACT_MAJOR_VERSION || '19';

const jsxRuntime = { runtime: 'automatic' as const };

export default defineConfig({
  oxc: { jsx: jsxRuntime },
  resolve: {
    alias: [
      {
        find: '@cp949/react-beautiful-dnd',
        replacement: path.resolve(import.meta.dirname, './src/index.ts'),
      },
      ...(reactMajorVersion === '18'
        ? [
            { find: /^react-dom(\/.*)?$/, replacement: 'react-dom-18$1' },
            { find: /^react(\/.*)?$/, replacement: 'react-18$1' },
          ]
        : []),
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.spec.{ts,tsx}'],
    setupFiles: ['./test/setup/vitest-setup.ts'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    // React 18 실행 시 외부 패키지(@testing-library/react 등)가 가져오는 react도
    // react-18로 연결한다. alias는 변환되는 소스에만 적용되므로 Node resolve hook을 함께 쓴다.
    execArgv:
      reactMajorVersion === '18'
        ? ['--import', './test/setup/react-18-hooks.mjs']
        : [],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/debug/**'],
    },
  },
});
