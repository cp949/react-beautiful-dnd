/**
 * @vitest-environment node
 *
 * We've decided to run the stylelint in the node environment
 * to avoid issues and conflicts with jsdom
 * See: https://github.com/stylelint/stylelint/issues/5904#issuecomment-1040585353
 */

import stylelint from 'stylelint';
import getStyles from '../../../../src/view/use-style-marshal/get-styles';

import type { Styles } from '../../../../src/view/use-style-marshal/get-styles';

interface LintResult {
  errored: boolean;
  cssLength: number;
}

async function lint(code: string): Promise<LintResult> {
  const result = await stylelint.lint({
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
  });
  // Types on _postcssResult are not properly working, so read it dynamically
  const css: string | undefined = (
    result.results[0] as { _postcssResult?: { css?: string } } | undefined
  )?.['_postcssResult']?.css;
  return { errored: result.errored, cssLength: css?.length ?? 0 };
}

const styles: Styles = getStyles('hey');

(Object.keys(styles) as Array<keyof Styles>).forEach((key) => {
  it(`should generate valid ${key} styles`, async () => {
    const result = await lint(styles[key]);

    expect(result.errored).toBe(false);
    // asserting that some CSS was actually generated!
    expect(result.cssLength).toBeGreaterThan(1);
  });
});
