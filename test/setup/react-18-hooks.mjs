// React 18 실행용 Node resolve hook.
// jest의 moduleNameMapper처럼, 외부 패키지(@testing-library/react 등)와 react-dom-18 내부가
// require/import 하는 react, react-dom도 react-18, react-dom-18로 연결한다.
// pnpm은 peer 의존성을 프로젝트의 react 19로 연결하므로 alias만으로는 부족하다.
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const match = /^(react|react-dom)(\/.*)?$/.exec(specifier);
    if (!match) {
      return nextResolve(specifier, context);
    }

    const mapped = `${match[1]}-18${match[2] ?? ''}`;
    const resolved = require.resolve(mapped);
    return { url: pathToFileURL(resolved).href, shortCircuit: true };
  },
});
