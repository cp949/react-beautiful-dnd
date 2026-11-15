import type { MockInstance } from 'vitest';
import { noop } from '../../src/empty';

function withConsole(type: 'error' | 'warn', fn: () => void, message?: string) {
  const mock = vi.spyOn(console, type).mockImplementation(noop);

  fn();

  expect(mock).toHaveBeenCalled();

  if (message) {
    expect(mock).toHaveBeenCalledWith(expect.stringContaining(message));
  }

  mock.mockReset();
}

export const withError = withConsole.bind(null, 'error');
export const withWarn = withConsole.bind(null, 'warn');

function withoutConsole(type: 'error' | 'warn', fn: () => void) {
  const mock = vi.spyOn(console, type).mockImplementation(noop);

  fn();

  expect(mock).not.toHaveBeenCalled();
  mock.mockReset();
}

export const withoutError = withoutConsole.bind(null, 'error');
export const withoutWarn = withoutConsole.bind(null, 'warn');

function disableConsole(type: 'error' | 'warn') {
  let mock: MockInstance;

  beforeEach(() => {
    mock = vi.spyOn(console, type).mockImplementation(noop);
  });

  afterEach(() => {
    mock.mockRestore();
  });
}

export const disableError = disableConsole.bind(null, 'error');
export const disableWarn = disableConsole.bind(null, 'warn');
