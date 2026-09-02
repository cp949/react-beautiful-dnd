import React from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { invariant } from '../../../../src/invariant';
import App from '../util/app';
import { noop } from '../../../../src/empty';
import getBodyElement from '../../../../src/view/get-body-element';

// Checking that the browser globals are available in this test file
invariant(
  typeof window !== 'undefined' && typeof document !== 'undefined',
  'browser globals not found in jsdom test',
);

it('should support hydrating a server side rendered application', () => {
  // would be done server side
  // we need to mock out the warnings caused by useLayoutEffect
  // This will not happen on the client as the string is rendered
  // on the server
  const error = jest.spyOn(console, 'error').mockImplementation(noop);

  const serverHTML: string = renderToString(<App />);

  error.mock.calls.forEach((call) => {
    expect(
      call[0].includes('Warning: useLayoutEffect does nothing on the server'),
    ).toBe(true);
  });
  error.mockRestore();

  const el = document.createElement('div');
  el.innerHTML = serverHTML;
  getBodyElement().appendChild(el);

  let root: Root | undefined;

  // hydrateRoot는 React 18+ 동시성 작업을 예약한다. act()로 감싸서 동기적으로
  // 플러시하지 않으면, 테스트 종료 후 jsdom 환경이 해제된 뒤에 예약된 작업이
  // 뒤늦게 발화되어 크래시가 발생한다.
  expect(() => {
    act(() => {
      root = hydrateRoot(el, <App />);
    });
  }).not.toThrow();

  act(() => {
    root?.unmount();
  });
});
