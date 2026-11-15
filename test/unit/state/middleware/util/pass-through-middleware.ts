import type { Mock } from 'vitest';
import type { Middleware } from '../../../../../src/state/store-types';

const passThroughMiddleware = (
  mock: Mock<(...args: [unknown]) => unknown>,
): Middleware => {
  const result: Middleware = () => (next) => (action) => {
    mock(action);
    next(action);
  };

  return result;
};

export default passThroughMiddleware;
