import React from 'react';
import { render } from '@testing-library/react';
import App from '../../util/app';
import { isDragging } from '../../util/helpers';
import { touch } from '../../util/controls';
import { noop } from '../../../../../src/empty';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should cancel a pending drag when unmounted', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(noop);
  const { getByText, unmount } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  touch.preLift(handle);

  unmount();

  // finish lift timer
  vi.runOnlyPendingTimers();

  expect(warn).not.toHaveBeenCalled();
  expect(isDragging(handle)).toBe(false);
  warn.mockRestore();
});
