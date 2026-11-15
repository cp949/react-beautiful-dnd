import { invariant } from '../../../../invariant';
import { noop } from '../../../../empty';
import type { FluidDragActions, PreDragActions } from '../../../../types';
import type {
  AnyEventBinding,
  EventOptions,
} from '../../../event-bindings/event-types';
import bindEvents from '../../../event-bindings/bind-events';

// mouse와 touch Sensor가 공유하는 Phase 모양.
// Sensor는 각자 필요한 값(point, timer 등)을 덧붙여 확장한다.
export interface IdlePhase {
  type: 'IDLE';
}

export interface PendingPhase {
  type: 'PENDING';
  actions: PreDragActions;
}

export interface DraggingPhase {
  type: 'DRAGGING';
  actions: FluidDragActions;
}

export type CapturePhase<
  TPending extends PendingPhase,
  TDragging extends DraggingPhase,
> = IdlePhase | TPending | TDragging;

export interface CaptureLifecycle<
  TPending extends PendingPhase,
  TDragging extends DraggingPhase,
> {
  getPhase: () => CapturePhase<TPending, TDragging>;
  // 값을 복사하지 않고 그대로 보관한다. Sensor가 phase 객체를 제자리에서 바꿀 수 있다.
  setPhase: (phase: TPending | TDragging) => void;
  // Capture binding을 풀고 IDLE에서 Pending drag로 전이한다.
  // createPending은 IDLE 검증을 통과한 뒤에 호출한다. 검증 전에 부작용(timer 등)을 만들지 않기 위해서다.
  startPendingDrag: (createPending: () => TPending) => void;
  // Lock이 해제되어 Capture로 돌아간다. actions.cancel/abort를 호출하지 않는다.
  // Lock 쪽 tryAbandon이 stop 직후 release()를 실행하므로 여기서 actions를 부르면 Lock이 이중 해제된다.
  stop: () => void;
  // stop을 먼저 하고, 그 뒤에 진행 중이던 drag를 cancel 또는 abort 한다.
  cancel: () => void;
  // Capture를 시작하고 unmount cleanup을 돌려준다.
  mount: () => () => void;
}

export interface CaptureLifecycleConfig<
  TPending extends PendingPhase,
  TDragging extends DraggingPhase,
> {
  // Capture 동안 window에 거는 binding. 생성 시 한 번만 호출한다.
  getCaptureBindings: (
    lifecycle: CaptureLifecycle<TPending, TDragging>,
  ) => AnyEventBinding[];
  // Pending drag를 시작할 때마다 호출한다. 배열 순서대로 bindEvents를 각각 호출하고,
  // 등록과 해제 모두 같은 순서를 지킨다.
  getDragBindingGroups: (
    lifecycle: CaptureLifecycle<TPending, TDragging>,
  ) => AnyEventBinding[][];
  // PENDING을 벗어날 때 정리할 것(예: long press timer). stop 안에서 phase를 IDLE로 바꾸기 전에 호출한다.
  cleanupPending?: (pending: TPending) => void;
  // true면 unmount 때 PENDING을 cleanupPending으로 정리하고 IDLE로 되돌린다.
  // false면 binding만 해제한다.
  resetPendingOnUnmount?: boolean;
}

const idle: IdlePhase = { type: 'IDLE' };

// Capture와 Pending drag 이후의 binding이 같은 옵션을 쓴다.
const eventOptions: EventOptions = { capture: true, passive: false };

export default function createCaptureLifecycle<
  TPending extends PendingPhase,
  TDragging extends DraggingPhase,
>(
  config: CaptureLifecycleConfig<TPending, TDragging>,
): CaptureLifecycle<TPending, TDragging> {
  let phase: CapturePhase<TPending, TDragging> = idle;
  let unbindEvents: () => void = noop;
  // lifecycle 생성 직후 채운다. mount 전에는 읽지 않는다.
  let captureBindings: AnyEventBinding[] = [];
  let isMounted = false;

  function listenForCapture() {
    // unmount 뒤에도 Lock은 이 lifecycle의 stop을 들고 있다(api가 바뀌어 새 lifecycle로 교체된 경우).
    // 그때 다시 걸면 해제할 주체가 없어 window listener가 남는다.
    if (!isMounted) {
      return;
    }
    unbindEvents = bindEvents(window, captureBindings, eventOptions);
  }

  function stop() {
    const current = phase;
    if (current.type === 'IDLE') {
      return;
    }

    if (current.type === 'PENDING' && config.cleanupPending) {
      config.cleanupPending(current);
    }

    phase = idle;
    unbindEvents();

    listenForCapture();
  }

  function cancel() {
    const current = phase;
    stop();
    if (current.type === 'DRAGGING') {
      current.actions.cancel({ shouldBlockNextClick: true });
    }
    if (current.type === 'PENDING') {
      current.actions.abort();
    }
  }

  function mount() {
    isMounted = true;
    listenForCapture();

    return function unmount() {
      isMounted = false;
      unbindEvents();

      if (config.resetPendingOnUnmount && phase.type === 'PENDING') {
        if (config.cleanupPending) {
          config.cleanupPending(phase);
        }
        phase = idle;
      }
    };
  }

  // captureBindings와 dragBindings가 lifecycle을 참조하므로 객체를 먼저 만들고
  // 그 안의 함수에서 나중에 참조한다.
  const lifecycle: CaptureLifecycle<TPending, TDragging> = {
    getPhase: () => phase,
    setPhase: (next) => {
      phase = next;
    },
    startPendingDrag: (createPending) => {
      // Capture binding 해제
      unbindEvents();

      invariant(
        phase.type === 'IDLE',
        'Expected to move from IDLE to PENDING drag',
      );
      phase = createPending();

      const unbinds: (() => void)[] = config
        .getDragBindingGroups(lifecycle)
        .map((bindings) => bindEvents(window, bindings, eventOptions));

      unbindEvents = function unbindAll() {
        unbinds.forEach((unbind) => unbind());
      };
    },
    stop,
    cancel,
    mount,
  };

  captureBindings = config.getCaptureBindings(lifecycle);

  return lifecycle;
}
