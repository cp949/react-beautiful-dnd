/**
 * Jest 30은 Node의 기본 TS 로더를 먼저 쓰는데, 이 로더는 import 확장자(.ts)를 요구한다.
 * 확장자 없는 import를 그대로 두기 위해 ts-node 로더를 지정한다.
 *
 * @jest-config-loader ts-node
 */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./test/typings/environment.d.ts" />

import type { Config } from 'jest';
import getReactMajorVersion from './test/util/get-react-major-version';
import isRunningInCI from './test/util/is-running-in-ci';

const reactMajorVersion = getReactMajorVersion();

const config: Config = {
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

if (isRunningInCI()) {
  config.maxWorkers = 2;
}

export default config;
