import type { MockInstance } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import Placeholder from '../../../../src/view/placeholder';
import { expectIsEmpty, expectIsFull } from './util/expect';
import { placeholder } from './util/data';
import getPlaceholderStyle from './util/get-placeholder-style';
import * as attributes from '../../../../src/view/data-attributes';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const contextId = 'hello-there';

let spy: MockInstance<typeof React.createElement>;

beforeEach(() => {
  spy = vi.spyOn(React, 'createElement');
});

afterEach(() => {
  spy.mockRestore();
});

const getCreatePlaceholderCalls = () => {
  return spy.mock.calls.filter((call) => {
    const props = call?.[1] as undefined | Record<string, unknown>;

    return props?.[attributes.placeholder.contextId] === contextId;
  });
};

it('should animate a mount', () => {
  const onClose = vi.fn();
  const onTransitionEnd = vi.fn();
  const { container } = render(
    <Placeholder
      contextId={contextId}
      animate="open"
      placeholder={placeholder}
      onClose={onClose}
      onTransitionEnd={onTransitionEnd}
    />,
  );

  expect(getCreatePlaceholderCalls().length).toBe(1);

  // first call had an empty size
  const onMount = getPlaceholderStyle(container);
  expectIsEmpty(onMount);

  // Will trigger a .setState
  act(() => {
    vi.runOnlyPendingTimers();
  });

  const postMount = getPlaceholderStyle(container);
  expectIsFull(postMount);
});

it('should not animate a mount if interrupted', () => {
  const onClose = vi.fn();
  const onTransitionEnd = vi.fn();
  const { container, rerender } = render(
    <Placeholder
      animate="open"
      contextId={contextId}
      placeholder={placeholder}
      onClose={onClose}
      onTransitionEnd={onTransitionEnd}
    />,
  );
  const onMount = getPlaceholderStyle(container);
  expectIsEmpty(onMount);

  expect(getCreatePlaceholderCalls()).toHaveLength(1);

  // interrupting animation
  rerender(
    <Placeholder
      animate="none"
      contextId={contextId}
      placeholder={placeholder}
      onClose={onClose}
      onTransitionEnd={onTransitionEnd}
    />,
  );

  // render 1: normal
  // render 2: useEffect calling setState
  // render 3: result of setState
  expect(getCreatePlaceholderCalls()).toHaveLength(3);

  const postMount = getPlaceholderStyle(container);
  expectIsFull(postMount);

  // validation - no further updates
  spy.mockClear();
  vi.runOnlyPendingTimers();
  rerender(
    <Placeholder
      animate="none"
      contextId={contextId}
      placeholder={placeholder}
      onClose={onClose}
      onTransitionEnd={onTransitionEnd}
    />,
  );
  expectIsFull(getPlaceholderStyle(container));
  expect(getCreatePlaceholderCalls()).toHaveLength(0);
});

it('should not animate in if unmounted', () => {
  const onClose = vi.fn();
  const onTransitionEnd = vi.fn();
  const error = vi.spyOn(console, 'error');

  const { container, unmount } = render(
    <Placeholder
      animate="open"
      contextId={contextId}
      placeholder={placeholder}
      onClose={onClose}
      onTransitionEnd={onTransitionEnd}
    />,
  );
  expectIsEmpty(getPlaceholderStyle(container));

  unmount();
  vi.runOnlyPendingTimers();

  // an internal setState would be triggered the timer was
  // not cleared when unmounting
  expect(error).not.toHaveBeenCalled();
  error.mockRestore();
});
