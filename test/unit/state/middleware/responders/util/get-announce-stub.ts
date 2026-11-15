import type { MockedFunction } from 'vitest';
import type { Announce } from '../../../../../../src/types';

export default (): MockedFunction<Announce> => vi.fn();
