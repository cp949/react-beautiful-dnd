const path = require('path');

module.exports = (api) => {
  const isTest = api.env('test');
  const isProduction = api.env('production');

  return {
    // Babel 8은 loose 옵션이 없어졌다. 같은 동작을 assumptions로 지정한다.
    assumptions: {
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
    },
    presets: [
      '@babel/react',
      // Babel 8 기본값은 type 없는 타입 import를 남긴다. 기존 동작을 유지한다.
      ['@babel/preset-typescript', { onlyRemoveTypeImports: false }],
      ['@babel/env', isTest ? { targets: { node: 'current' } } : {}],
    ].filter(Boolean),
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            '@cp949/react-beautiful-dnd':
              process.env.USE_PRODUCTION_BUILD === 'true'
                ? path.resolve(__dirname, './dist/react-beautiful-dnd.esm')
                : path.resolve(__dirname, './src/index.ts'),
          },
        },
      ],
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
      // used for stripping out the `invariant` messages in production builds
      isProduction ? 'babel-plugin-dev-expression' : false,
    ].filter(Boolean),
    comments: false,
  };
};
