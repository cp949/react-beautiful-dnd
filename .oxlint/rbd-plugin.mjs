// oxlint에 `no-restricted-syntax`가 없어서 이 프로젝트가 ESLint에서 쓰던 선택자 규칙을
// 그대로 옮긴 로컬 JS 플러그인이다. 규칙을 추가할 때는 selectors 배열에 항목을 더한다.
// 비활성화 주석은 `// eslint-disable-next-line rbd/no-restricted-syntax` 형식을 쓴다.
const selectors = [
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
      'Must use `useLayoutEffect` as the name of the import from `*use-isomorphic-layout-effect` to leverage `react-hooks/exhaustive-deps`',
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
];

const noRestrictedSyntax = {
  create(context) {
    const visitor = {};
    for (const { selector, message } of selectors) {
      visitor[selector] = (node) => {
        context.report({ node, message });
      };
    }
    return visitor;
  },
};

export default {
  meta: { name: 'rbd' },
  rules: { 'no-restricted-syntax': noRestrictedSyntax },
};
