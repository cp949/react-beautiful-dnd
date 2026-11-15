// 이 파일은 CJS(.js)로 둔다. .ts로 두면 Jest 30이 Node 기본 TS 로더를 쓰는데,
// 이 로더는 import 확장자 요구와 ESM 해석(require 사용 불가) 제약이 있어
// 별도 로더(ts-node 등)가 필요해진다.

const reactMajorVersion = process.env.REACT_MAJOR_VERSION || '19';

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  modulePathIgnorePatterns: ['/dist/'],
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,

  setupFiles: ['./test/setup/env-setup.ts'],
  setupFilesAfterEnv: ['./test/setup/test-setup.ts'],
  testEnvironment: './test/setup/environment.ts',
  // node_modules is default.
  testPathIgnorePatterns: ['/node_modules/', '/cypress/'],
  transform: {
    // 문자열 'babel-jest'는 jest 내부의 @babel/core 7에 묶인 사본으로 해석된다.
    // Babel 8로 변환하려면 이 저장소에 설치된 babel-jest의 경로를 지정한다.
    '\\.[jt]sx?$': require.resolve('babel-jest'),
  },
  verbose: true,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

// eslint-disable-next-line no-console
console.log('Testing with React version:', `${reactMajorVersion}.x.x`);

if (reactMajorVersion === '18') {
  config.cacheDirectory = `.cache/jest-cache-react-${reactMajorVersion}`;
  config.moduleNameMapper = {
    '^react-dom((\\/.*)?)$': `react-dom-${reactMajorVersion}$1`,
    '^react((\\/.*)?)$': `react-${reactMajorVersion}$1`,
  };
}

if (process.env.CI) {
  config.maxWorkers = 2;
}

module.exports = config;
