/**
 * @jest-environment node
 *
 * We've decided to run the stylelint in the node environment
 * to avoid issues and conflicts with jsdom
 * See: https://github.com/stylelint/stylelint/issues/5904#issuecomment-1040585353
 */

import { execFileSync } from 'child_process';
import path from 'path';
import getStyles from '../../../../src/view/use-style-marshal/get-styles';

import type { Styles } from '../../../../src/view/use-style-marshal/get-styles';

interface LintResult {
  errored: boolean;
  cssLength: number;
}

// stylelint 18은 ESM 전용이라 jest의 CommonJS 변환 환경에서는 import할 수 없다.
// 별도 Node 프로세스에서 ESM으로 실행하고 결과만 JSON으로 받는다.
const lintScript = `
import stylelint from 'stylelint';

const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}
const { code, config } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
const result = await stylelint.lint({ code, config });
// Types on _postcssResult are not properly working, so read it dynamically
const css = result.results[0]?._postcssResult?.css;
console.log(JSON.stringify({ errored: result.errored, cssLength: css?.length ?? 0 }));
`;

const repositoryRoot = path.resolve(__dirname, '../../../..');

function lint(code: string): LintResult {
  const output = execFileSync(
    'node',
    ['--input-type=module', '--eval', lintScript],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      input: JSON.stringify({
        code,
        config: {
          // just using the recommended config as it only checks for errors and not formatting
          extends: ['stylelint-config-recommended'],
          rules: {
            // stylelint-config-recommended 15부터 켜진 규칙이다. 의도적으로 쓰는
            // 벤더 접두사 폴백(cursor: -webkit-grab)을 알 수 없는 값으로 판단한다.
            'declaration-property-value-no-unknown': null,
          },
        },
      }),
    },
  );
  return JSON.parse(output) as LintResult;
}

const styles: Styles = getStyles('hey');

(Object.keys(styles) as Array<keyof Styles>).forEach((key) => {
  it(`should generate valid ${key} styles`, () => {
    const result = lint(styles[key]);

    expect(result.errored).toBe(false);
    // asserting that some CSS was actually generated!
    expect(result.cssLength).toBeGreaterThan(1);
  });
});
