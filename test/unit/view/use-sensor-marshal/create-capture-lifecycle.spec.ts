import type { Mock } from 'vitest';
import type { Position } from 'css-box-model';
import createCaptureLifecycle from '../../../../src/view/use-sensor-marshal/sensors/util/create-capture-lifecycle';
import type {
  CaptureLifecycle,
  DraggingPhase,
  PendingPhase,
} from '../../../../src/view/use-sensor-marshal/sensors/util/create-capture-lifecycle';
import type { FluidDragActions, PreDragActions } from '../../../../src/types';

interface Pending extends PendingPhase {
  point: Position;
}

interface Dragging extends DraggingPhase {
  hasMoved: boolean;
}

type Lifecycle = CaptureLifecycle<Pending, Dragging>;

// 호출 순서를 기록해서 stop과 cancel의 순서를 검증한다.
let calls: string[];
let captureFn: Mock;
let dragFn: Mock;
let cleanupPending: Mock;
let unmounts: (() => void)[];

const point: Position = { x: 10, y: 20 };

function getPreDragActions(): PreDragActions {
  return {
    abort: vi.fn(() => calls.push('abort')),
  } as unknown as PreDragActions;
}

function getFluidActions(): FluidDragActions {
  return {
    cancel: vi.fn(() => calls.push('cancel')),
  } as unknown as FluidDragActions;
}

function setup(options: { resetPendingOnUnmount?: boolean } = {}): Lifecycle {
  const lifecycle: Lifecycle = createCaptureLifecycle<Pending, Dragging>({
    getCaptureBindings: () => [{ eventName: 'capture-event', fn: captureFn }],
    getDragBindingGroups: () => [[{ eventName: 'drag-event', fn: dragFn }]],
    cleanupPending,
    resetPendingOnUnmount: options.resetPendingOnUnmount,
  });
  unmounts.push(lifecycle.mount());
  return lifecycle;
}

function startPending(lifecycle: Lifecycle, actions = getPreDragActions()) {
  lifecycle.startPendingDrag(() => ({ type: 'PENDING', point, actions }));
  return actions;
}

function startDragging(lifecycle: Lifecycle): FluidDragActions {
  const actions: FluidDragActions = getFluidActions();
  lifecycle.setPhase({ type: 'DRAGGING', actions, hasMoved: false });
  return actions;
}

// binding이 window에 걸려 있는지는 이벤트를 보내서 확인한다.
function fire(eventName: string) {
  window.dispatchEvent(new Event(eventName));
}

beforeEach(() => {
  calls = [];
  captureFn = vi.fn();
  dragFn = vi.fn();
  cleanupPending = vi.fn(() => calls.push('cleanupPending'));
  unmounts = [];
});

afterEach(() => {
  unmounts.forEach((unmount) => unmount());
});

describe('Capture', () => {
  it('mount하면 Capture binding만 걸린다', () => {
    const lifecycle = setup();

    fire('capture-event');
    fire('drag-event');

    expect(captureFn).toHaveBeenCalledTimes(1);
    expect(dragFn).not.toHaveBeenCalled();
    expect(lifecycle.getPhase().type).toBe('IDLE');
  });

  it('Pending drag를 시작하면 Capture binding을 풀고 drag binding을 건다', () => {
    const lifecycle = setup();

    startPending(lifecycle);
    fire('capture-event');
    fire('drag-event');

    expect(lifecycle.getPhase().type).toBe('PENDING');
    expect(captureFn).not.toHaveBeenCalled();
    expect(dragFn).toHaveBeenCalledTimes(1);
  });

  it('drag binding group을 배열 순서대로 걸고 stop하면 모두 해제한다', () => {
    const lifecycle: Lifecycle = createCaptureLifecycle<Pending, Dragging>({
      getCaptureBindings: () => [{ eventName: 'capture-event', fn: captureFn }],
      // touch처럼 두 group이 같은 이벤트를 듣는 경우. 먼저 건 group의 handler가 먼저 실행된다.
      getDragBindingGroups: () => [
        [{ eventName: 'shared-event', fn: () => calls.push('first') }],
        [{ eventName: 'shared-event', fn: () => calls.push('second') }],
      ],
    });
    unmounts.push(lifecycle.mount());
    startPending(lifecycle);

    fire('shared-event');
    expect(calls).toEqual(['first', 'second']);

    lifecycle.stop();
    fire('shared-event');

    expect(calls).toEqual(['first', 'second']);
  });

  it('IDLE이 아닐 때 Pending drag를 시작하면 pending을 만들지 않고 오류를 던진다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    const createPending = vi.fn();

    expect(() => lifecycle.startPendingDrag(createPending)).toThrow(
      'Expected to move from IDLE to PENDING drag',
    );
    expect(createPending).not.toHaveBeenCalled();
  });
});

describe('stop', () => {
  it('IDLE에서 호출하면 아무것도 하지 않는다', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const lifecycle = setup();
    const addCount = addSpy.mock.calls.length;
    const removeCount = removeSpy.mock.calls.length;

    lifecycle.stop();
    lifecycle.stop();

    expect(addSpy).toHaveBeenCalledTimes(addCount);
    expect(removeSpy).toHaveBeenCalledTimes(removeCount);
    expect(cleanupPending).not.toHaveBeenCalled();
    expect(lifecycle.getPhase().type).toBe('IDLE');
  });

  it('두 번 호출해도 Capture binding이 중복으로 걸리지 않는다', () => {
    const lifecycle = setup();
    startPending(lifecycle);

    lifecycle.stop();
    lifecycle.stop();
    fire('capture-event');

    expect(captureFn).toHaveBeenCalledTimes(1);
  });

  it('PENDING에서 호출하면 drag binding을 풀고 Capture로 돌아간다', () => {
    const lifecycle = setup();
    startPending(lifecycle);

    lifecycle.stop();
    fire('drag-event');
    fire('capture-event');

    expect(lifecycle.getPhase().type).toBe('IDLE');
    expect(dragFn).not.toHaveBeenCalled();
    expect(captureFn).toHaveBeenCalledTimes(1);
  });

  it('PENDING 정리 hook을 phase를 IDLE로 바꾸기 전에 호출한다', () => {
    const lifecycle = setup();
    const pending: Pending = {
      type: 'PENDING',
      point,
      actions: getPreDragActions(),
    };
    lifecycle.startPendingDrag(() => pending);
    cleanupPending.mockImplementation(() => {
      calls.push(`cleanupPending:${lifecycle.getPhase().type}`);
    });

    lifecycle.stop();

    expect(calls).toEqual(['cleanupPending:PENDING']);
    expect(cleanupPending).toHaveBeenCalledWith(pending);
  });

  it('DRAGGING에서는 PENDING 정리 hook을 호출하지 않는다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    startDragging(lifecycle);

    lifecycle.stop();

    expect(cleanupPending).not.toHaveBeenCalled();
    expect(lifecycle.getPhase().type).toBe('IDLE');
  });

  it('PENDING에서 actions.abort를 호출하지 않는다', () => {
    const lifecycle = setup();
    const actions = startPending(lifecycle);

    lifecycle.stop();

    expect(actions.abort).not.toHaveBeenCalled();
  });

  it('DRAGGING에서 actions.cancel을 호출하지 않는다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    const actions = startDragging(lifecycle);

    lifecycle.stop();

    expect(actions.cancel).not.toHaveBeenCalled();
  });
});

describe('cancel', () => {
  it('DRAGGING에서는 stop을 먼저 하고 actions.cancel을 호출한다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    const actions = startDragging(lifecycle);
    (actions.cancel as Mock).mockImplementation(() => {
      calls.push(`cancel:${lifecycle.getPhase().type}`);
      // stop이 끝난 뒤이므로 Capture binding이 이미 걸려 있어야 한다.
      fire('capture-event');
    });

    lifecycle.cancel();

    expect(calls).toEqual(['cancel:IDLE']);
    expect(actions.cancel).toHaveBeenCalledWith({ shouldBlockNextClick: true });
    expect(captureFn).toHaveBeenCalledTimes(1);
  });

  it('PENDING에서는 정리 hook, stop 순으로 진행한 뒤 actions.abort를 호출한다', () => {
    const lifecycle = setup();
    const actions = startPending(lifecycle);
    (actions.abort as Mock).mockImplementation(() => {
      calls.push(`abort:${lifecycle.getPhase().type}`);
    });

    lifecycle.cancel();

    expect(calls).toEqual(['cleanupPending', 'abort:IDLE']);
  });

  it('두 번 호출해도 actions는 한 번만 호출한다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    const actions = startDragging(lifecycle);

    lifecycle.cancel();
    lifecycle.cancel();

    expect(actions.cancel).toHaveBeenCalledTimes(1);
  });

  it('IDLE에서는 아무 actions도 호출하지 않는다', () => {
    const lifecycle = setup();

    lifecycle.cancel();

    expect(calls).toEqual([]);
  });
});

describe('phase 객체', () => {
  it('setPhase로 넣은 객체를 복사하지 않고 제자리 변경을 그대로 보여준다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    const dragging: Dragging = {
      type: 'DRAGGING',
      actions: getFluidActions(),
      hasMoved: false,
    };

    lifecycle.setPhase(dragging);
    dragging.hasMoved = true;

    expect(lifecycle.getPhase()).toBe(dragging);
    expect((lifecycle.getPhase() as Dragging).hasMoved).toBe(true);
  });
});

describe('unmount', () => {
  it('binding을 해제한다', () => {
    const lifecycle = setup();
    startPending(lifecycle);

    unmounts.pop()?.();
    fire('drag-event');
    fire('capture-event');

    expect(dragFn).not.toHaveBeenCalled();
    expect(captureFn).not.toHaveBeenCalled();
    expect(lifecycle.getPhase().type).toBe('PENDING');
  });

  it('resetPendingOnUnmount가 true면 PENDING을 정리하고 IDLE로 되돌린다', () => {
    const lifecycle = setup({ resetPendingOnUnmount: true });
    startPending(lifecycle);

    unmounts.pop()?.();

    expect(cleanupPending).toHaveBeenCalledTimes(1);
    expect(lifecycle.getPhase().type).toBe('IDLE');
  });

  it('unmount 뒤에 stop하면 Capture binding을 다시 걸지 않고, 다시 mount하면 건다', () => {
    const lifecycle = setup();
    startPending(lifecycle);
    unmounts.pop()?.();

    // Lock은 unmount 뒤에도 stop을 부를 수 있다.
    lifecycle.stop();
    fire('capture-event');

    expect(lifecycle.getPhase().type).toBe('IDLE');
    expect(captureFn).not.toHaveBeenCalled();

    unmounts.push(lifecycle.mount());
    fire('capture-event');

    expect(captureFn).toHaveBeenCalledTimes(1);
  });

  it('resetPendingOnUnmount가 true여도 DRAGGING은 건드리지 않는다', () => {
    const lifecycle = setup({ resetPendingOnUnmount: true });
    startPending(lifecycle);
    const dragging: Dragging = {
      type: 'DRAGGING',
      actions: getFluidActions(),
      hasMoved: false,
    };
    lifecycle.setPhase(dragging);

    unmounts.pop()?.();

    expect(cleanupPending).not.toHaveBeenCalled();
    expect(lifecycle.getPhase()).toBe(dragging);
  });
});
