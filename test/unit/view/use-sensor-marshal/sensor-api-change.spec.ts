import type { Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import useMouseSensor, {
  primaryButton,
} from '../../../../src/view/use-sensor-marshal/sensors/use-mouse-sensor';
import useTouchSensor, {
  timeForLongPress,
} from '../../../../src/view/use-sensor-marshal/sensors/use-touch-sensor';
import type {
  FluidDragActions,
  PreDragActions,
  SensorAPI,
} from '../../../../src/types';

// api identity가 바뀌면 Sensor는 새 lifecycle을 만들고 이전 것은 unmount한다.
// 이전 lifecycle의 stop은 Lock이 계속 들고 있으므로, 나중에 불려도 window에 listener를 남기면 안 된다.

interface FakeApi {
  api: SensorAPI;
  findClosestDraggableId: Mock;
  getForceStop: () => () => void;
}

function getFakeApi(): FakeApi {
  let forceStop: (() => void) | null = null;
  const fluid = {
    move: vi.fn(),
    drop: vi.fn(),
    cancel: vi.fn(),
    shouldRespectForcePress: () => false,
  } as unknown as FluidDragActions;
  const actions = {
    abort: vi.fn(),
    fluidLift: vi.fn(() => fluid),
    shouldRespectForcePress: () => false,
  } as unknown as PreDragActions;
  const findClosestDraggableId = vi.fn(() => 'item');

  const api = {
    canGetLock: vi.fn(() => true),
    tryGetLock: vi.fn((_id: string, stop: () => void) => {
      forceStop = stop;
      return actions;
    }),
    findClosestDraggableId,
    findOptionsForDraggable: vi.fn(() => null),
    tryReleaseLock: vi.fn(),
    isLockClaimed: vi.fn(() => false),
  } as unknown as SensorAPI;

  return {
    api,
    findClosestDraggableId,
    getForceStop: () => {
      if (!forceStop) {
        throw new Error('Lock을 얻지 않았다');
      }
      return forceStop;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

function fireMouseDown() {
  window.dispatchEvent(
    new MouseEvent('mousedown', {
      button: primaryButton,
      cancelable: true,
      clientX: 0,
      clientY: 0,
    }),
  );
}

function fireTouchStart() {
  const event = new Event('touchstart', { cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: [{ clientX: 0, clientY: 0 }],
  });
  window.dispatchEvent(event);
}

it('mouse: Pending drag 중 api가 바뀐 뒤 이전 Lock이 stop하면 unmount 후 이전 listener가 남지 않는다', () => {
  const first = getFakeApi();
  const second = getFakeApi();
  const { rerender, unmount } = renderHook(
    (api: SensorAPI) => useMouseSensor(api),
    {
      initialProps: first.api,
    },
  );

  fireMouseDown();
  expect(first.findClosestDraggableId).toHaveBeenCalledTimes(1);

  rerender(second.api);
  // Lock이 이전 lifecycle의 stop을 부른다(예: DragDropContext unmount의 tryAbandon).
  first.getForceStop()();
  unmount();

  fireMouseDown();

  expect(first.findClosestDraggableId).toHaveBeenCalledTimes(1);
  expect(second.findClosestDraggableId).not.toHaveBeenCalled();
});

it('touch: drag 중 api가 바뀐 뒤 이전 Lock이 stop하면 unmount 후 이전 listener가 남지 않는다', () => {
  vi.useFakeTimers();
  const first = getFakeApi();
  const second = getFakeApi();
  const { rerender, unmount } = renderHook(
    (api: SensorAPI) => useTouchSensor(api),
    {
      initialProps: first.api,
    },
  );

  fireTouchStart();
  // long press가 지나 DRAGGING으로 넘어간다. PENDING은 unmount 때 정리되므로 DRAGGING이어야 재현된다.
  vi.advanceTimersByTime(timeForLongPress);
  expect(first.findClosestDraggableId).toHaveBeenCalledTimes(1);

  rerender(second.api);
  first.getForceStop()();
  unmount();

  fireTouchStart();

  expect(first.findClosestDraggableId).toHaveBeenCalledTimes(1);
  expect(second.findClosestDraggableId).not.toHaveBeenCalled();
});
