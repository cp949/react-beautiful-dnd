import type { MockInstance } from 'vitest';
import { warning } from '../../src/dev-warning';

let consoleWarnSpy: MockInstance;

beforeEach(() => {
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
});

it('should log a warning to the console', () => {
  warning('hey');

  expect(consoleWarnSpy).toHaveBeenCalled();
});

it('should not log a warning if warnings are disabled', () => {
  window['__@hello-pangea/dnd-disable-dev-warnings'] = true;

  warning('hey');
  warning('sup');
  warning('hi');

  expect(consoleWarnSpy).not.toHaveBeenCalled();

  // re-enable

  window['__@hello-pangea/dnd-disable-dev-warnings'] = false;

  warning('hey');

  expect(consoleWarnSpy).toHaveBeenCalled();
});
