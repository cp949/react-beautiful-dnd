import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import es5 from 'eslint-plugin-es5';
import nPlugin from 'eslint-plugin-n';
import jestPlugin from 'eslint-plugin-jest';
import storybookPlugin from 'eslint-plugin-storybook';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

// 프로젝트 고유 커스텀 규칙 (원래 eslint-config-airbnb를 대체하기 위해
// 명시적으로 유지해야 하는 것들 - src/invariant.js 강제, useMemoOne 강제 등)
const projectRules = {
  'prettier/prettier': 'error',
  'lines-between-class-members': 'off',
  'no-console': ['error'],
  'prefer-destructuring': 'off',
  'no-underscore-dangle': ['error', { allowAfterThis: true }],
  'no-param-reassign': ['error', { props: false }],
  'import-x/prefer-default-export': 'off',
  'max-classes-per-file': 'off',
  'no-plusplus': 'off',
  curly: ['error', 'all'],
  'no-restricted-syntax': [
    'error',
    {
      selector: 'UnaryExpression[operator="!"] > UnaryExpression[operator="!"]',
      message:
        '!! to cast to boolean relies on a double negative. Use Boolean() instead',
    },
    {
      selector: 'NewExpression[callee.name="Boolean"]',
      message:
        'Avoid using constructor: `new Boolean(value)` as it creates a Boolean object. Did you mean `Boolean(value)`?',
    },
    {
      selector:
        'ImportDeclaration[source.value=/use-isomorphic-layout-effect/] > ImportDefaultSpecifier[local.name!="useLayoutEffect"]',
      message:
        'Must use `useLayoutEffect` as the name of the import from `*use-isomorphic-layout-effect` to leverage `eslint-plugin-react-hooks`',
    },
    {
      selector: 'ImportDeclaration[source.value="tiny-invariant"]',
      message:
        'Please use our own invariant function (src/invariant.js) to ensure correct error flow',
    },
    {
      selector: 'ThrowStatement',
      message:
        'Please use invariant (src/invariant.js) for throwing. This is to ensure correct error flows',
    },
  ],
  'no-restricted-exports': ['error', { restrictedNamedExports: ['then'] }],
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'react',
          importNames: ['useMemo', 'useCallback'],
          message:
            '`useMemo` and `useCallback` are subject to cache busting. Please use methods from `src/use-memo-one.ts`',
        },
        {
          name: 'react',
          importNames: ['useLayoutEffect'],
          message:
            '`useLayoutEffect` causes a warning in SSR. Use `useIsomorphicLayoutEffect`',
        },
      ],
    },
  ],
  'react/function-component-definition': [
    'error',
    { namedComponents: ['arrow-function', 'function-declaration'] },
  ],
  'react/jsx-filename-extension': 'off',
  'react/require-default-props': 'off',
  'react/prefer-stateless-function': 'off',
  'react/no-multi-comp': 'off',
  'react/forbid-prop-types': 'off',
  'react/no-access-state-in-setstate': 'off',
  'react/destructuring-assignment': 'off',
  'react/no-unused-prop-types': ['error', { skipShapeProps: true }],
  'react/default-props-match-prop-types': 'off',
  'react/prop-types': 'off',
  'react/jsx-no-bind': 'off',
  'import-x/no-extraneous-dependencies': 'off',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'error',
  'react/jsx-props-no-spreading': 'off',
  'react/jsx-fragments': 'off',
  'react/static-property-placement': 'off',
  'react/state-in-constructor': 'off',
  // airbnb가 명시적으로 껐던 규칙 - 익명 함수 컴포넌트를 자주 쓰는 이 코드베이스와 충돌함
  'react/display-name': 'off',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'site/**',
      'coverage/**',
      'test-reports/**',
      '.storybook-out/**',
      'pnpm-lock.yaml',
    ],
  },

  js.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        TimeoutID: 'readonly',
        IntervalID: 'readonly',
        AnimationFrameID: 'readonly',
      },
    },
  },

  // JS/JSX: babel 파서 (기존 .eslintrc.js와 동일하게 class properties 등을 지원)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parser: await import('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: true,
        babelOptions: {
          configFile: new URL('./babel.config.js', import.meta.url).pathname,
        },
      },
    },
  },

  // React / react-hooks / jsx-a11y / import-x / prettier: 전체 JS/TS 파일
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'import-x': importX,
    },
    settings: {
      react: { version: 'detect' },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json', './*/tsconfig.json'],
        }),
      ],
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...importX.configs['flat/recommended'].rules,
      ...projectRules,
    },
  },

  // TypeScript 파일
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts?(x)'],
  })),
  {
    files: ['**/*.ts?(x)'],
    plugins: { 'import-x': importX },
    rules: {
      ...importX.configs['flat/typescript'].rules,
      'import-x/extensions': [
        'error',
        'ignorePackages',
        { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error'],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': ['error'],
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': ['error'],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },

  // src/**/*.js: ES5 호환성 강제
  {
    files: ['src/**/*.js'],
    plugins: { es5 },
    rules: {
      'es5/no-es6-methods': 'error',
      'es5/no-es6-static-methods': [
        'error',
        { exceptMethods: ['Object.assign'] },
      ],
    },
  },

  // NodeJS 스크립트 (CommonJS)
  {
    files: [
      'a11y-audit-parse.js',
      'browser-test-harness.js',
      'babel.config.js',
      'commitlint.config.js',
      'jest.config.js',
      'lighthouse.config.js',
      'server-ports.js',
      'eslint.config.mjs',
      'test/**/*.js?(x)',
    ],
    plugins: { n: nPlugin },
    rules: {
      ...nPlugin.configs['flat/recommended-script'].rules,
    },
  },

  // stories/**
  {
    files: ['stories/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'class-methods-use-this': 'off',
      'react/function-component-definition': 'off',
      'react/state-in-constructor': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
    },
  },
  ...storybookPlugin.configs['flat/recommended'],

  // test/**
  {
    files: ['test/**/*.{js,jsx,ts,tsx}'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: { ...globals.jest },
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
      'react/function-component-definition': 'off',
      // 27.9.0(마이그레이션 전 버전)의 recommended에는 없던 새 규칙.
      // test/**/util/*.ts 헬퍼가 export하는 관례와 충돌한다.
      'jest/no-export': 'off',
      'jest/expect-expect': [
        'error',
        {
          assertFunctionNames: [
            'expect',
            'withWarn',
            'withError',
            'withoutError',
            'withoutWarn',
          ],
        },
      ],
    },
  },

  // cypress/**: eslint-plugin-cypress 없이, 최소 전역만 등록
  {
    files: ['cypress/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        cy: 'readonly',
        Cypress: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
      },
    },
  },

  // .storybook/**
  {
    files: ['.storybook/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },

  // prettier: 항상 마지막 (스타일 규칙 충돌 해제)
  prettierRecommended,
);
