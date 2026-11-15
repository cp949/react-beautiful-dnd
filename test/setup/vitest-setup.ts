// 모든 테스트 파일이 실행되기 전에 로드되는 vitest setup.
import '@testing-library/jest-dom/vitest';
import createStub from 'raf-stub';
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';
import './browser';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace requestAnimationFrame {
    function add(cb: () => void): number;
    function remove(id: number): void;
    function flush(duration?: number): void;
    function reset(): void;
    function step(steps?: number, duration?: number): void;
  }
}

// 이 setup이 덮어쓰는 전역 값의 타입.
interface OverriddenGlobals {
  requestAnimationFrame: (cb: () => void) => number;
  cancelAnimationFrame: (id: number) => void;
  TransitionEvent: typeof Event;
}
const scope = globalThis as unknown as OverriddenGlobals;

// node 환경(`@vitest-environment node`)에서는 window가 없으므로 DOM 관련 설정을 건너뛴다.
if (typeof window !== 'undefined') {
  // requestAnimationFrame을 stub으로 대체한다.
  // fake timer를 켜고 끌 때 전역 값이 바뀌므로, 전환할 때마다 stub을 다시 설치한다.
  const rafStub = createStub(1000 / 60, performance.now());
  Object.assign(rafStub.add, {
    step: rafStub.step,
    flush: rafStub.flush,
    reset: rafStub.reset,
  });
  const installRaf = () => {
    scope.requestAnimationFrame = rafStub.add;
    scope.cancelAnimationFrame = rafStub.remove;
  };
  installRaf();

  const originalUseFakeTimers = vi.useFakeTimers.bind(vi);
  vi.useFakeTimers = (config) => {
    const result = originalUseFakeTimers(config);
    installRaf();
    return result;
  };
  const originalUseRealTimers = vi.useRealTimers.bind(vi);
  vi.useRealTimers = () => {
    const result = originalUseRealTimers();
    installRaf();
    return result;
  };

  // jsdom은 TransitionEvent를 구현하지 않으므로 polyfill을 둔다.
  // 참고: https://github.com/jsdom/jsdom/issues/1781
  class TransitionEvent extends Event {
    readonly elapsedTime: number;
    readonly propertyName: string;
    readonly pseudoElement: string;

    constructor(type: string, init: TransitionEventInit = {}) {
      super(type, init);

      this.elapsedTime = init.elapsedTime || 0.0;
      this.propertyName = init.propertyName || '';
      this.pseudoElement = init.pseudoElement || '';
    }
  }
  scope.TransitionEvent = TransitionEvent;
}

// 테스트마다 모듈 레지스트리를 비운다(jest의 resetModules: true에 대응).
// 모든 테스트가 assertion을 하나 이상 갖도록 강제한다.
beforeEach(() => {
  vi.resetModules();
  // eslint-disable-next-line jest/no-standalone-expect
  expect.hasAssertions();
});

if (typeof document !== 'undefined') {
  // 이 패키지는 document가 없으면 import만으로 오류가 나므로 조건부로 불러온다.
  const { cleanup, fireEvent } = await import('@testing-library/react');

  // 이전에 마운트한 컴포넌트를 정리한다.
  beforeAll(cleanup);
  afterEach(() => {
    cleanup();
    // drop 이후 남는 click blocker를 매 테스트 전에 정리한다.
    fireEvent.click(window);
  });
}
