import type { Position } from 'css-box-model';
import { useMemo } from '../../../use-memo-one';
import { invariant } from '../../../invariant';
import type {
  PreDragActions,
  FluidDragActions,
  DraggableId,
  SensorAPI,
  DraggableOptions,
} from '../../../types';
import type {
  AnyEventBinding,
  EventBinding,
  MouseEventBinding,
} from '../../event-bindings/event-types';
import * as keyCodes from '../../key-codes';
import preventStandardKeyEvents from './util/prevent-standard-key-events';
import supportedPageVisibilityEventName from './util/supported-page-visibility-event-name';
import useLayoutEffect from '../../use-isomorphic-layout-effect';
import createCaptureLifecycle from './util/create-capture-lifecycle';
import type {
  CaptureLifecycle,
  CapturePhase,
  DraggingPhase,
  PendingPhase,
} from './util/create-capture-lifecycle';

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
export const primaryButton = 0;
export const sloppyClickThreshold = 5;

function isSloppyClickThresholdExceeded(
  original: Position,
  current: Position,
): boolean {
  return (
    Math.abs(current.x - original.x) >= sloppyClickThreshold ||
    Math.abs(current.y - original.y) >= sloppyClickThreshold
  );
}

interface Pending extends PendingPhase {
  point: Position;
}

type Dragging = DraggingPhase;

type Phase = CapturePhase<Pending, Dragging>;

type MouseLifecycle = CaptureLifecycle<Pending, Dragging>;

function getDragBindings({
  cancel,
  stop: completed,
  getPhase,
  setPhase,
}: MouseLifecycle): AnyEventBinding[] {
  return [
    {
      eventName: 'mousemove',
      fn: (event: MouseEvent) => {
        const { button, clientX, clientY } = event;
        if (button !== primaryButton) {
          return;
        }

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        const phase: Phase = getPhase();

        // Already dragging
        if (phase.type === 'DRAGGING') {
          // preventing default as we are using this event
          event.preventDefault();
          phase.actions.move(point);
          return;
        }

        // There should be a pending drag at this point
        invariant(phase.type === 'PENDING', 'Cannot be IDLE');
        const pending: Position = phase.point;

        // threshold not yet exceeded
        if (!isSloppyClickThresholdExceeded(pending, point)) {
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();

        // Lifting at the current point to prevent the draggable item from
        // jumping by the sloppyClickThreshold
        const actions: FluidDragActions = phase.actions.fluidLift(point);

        setPhase({
          type: 'DRAGGING',
          actions,
        });
      },
    },
    {
      eventName: 'mouseup',
      fn: (event: MouseEvent) => {
        const phase: Phase = getPhase();

        if (phase.type !== 'DRAGGING') {
          cancel();
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();
        phase.actions.drop({ shouldBlockNextClick: true });
        completed();
      },
    },
    {
      eventName: 'mousedown',
      fn: (event: MouseEvent) => {
        // this can happen during a drag when the user clicks a button
        // other than the primary mouse button
        if (getPhase().type === 'DRAGGING') {
          event.preventDefault();
        }

        cancel();
      },
    },
    {
      eventName: 'keydown',
      fn: (event: KeyboardEvent) => {
        const phase: Phase = getPhase();
        // Abort if any keystrokes while a drag is pending
        if (phase.type === 'PENDING') {
          cancel();
          return;
        }

        // cancelling a drag
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
          cancel();
          return;
        }

        preventStandardKeyEvents(event);
      },
    },
    {
      eventName: 'resize',
      fn: cancel,
    },
    {
      eventName: 'scroll',
      // kill a pending drag if there is a window scroll
      options: { passive: true, capture: false },
      fn: () => {
        if (getPhase().type === 'PENDING') {
          cancel();
        }
      },
    },

    // Need to opt out of dragging if the user is a force press
    // Only for safari which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    {
      eventName: 'webkitmouseforcedown',
      // it is considered a indirect cancel so we do not
      // prevent default in any situation.
      fn: (event: Event) => {
        const phase: Phase = getPhase();
        invariant(phase.type !== 'IDLE', 'Unexpected phase');

        if (phase.actions.shouldRespectForcePress()) {
          cancel();
          return;
        }

        // This technically doesn't do anything.
        // It won't do anything if `webkitmouseforcewillbegin` is prevented.
        // But it is a good signal that we want to opt out of this

        event.preventDefault();
      },
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];
}

function createMouseLifecycle(api: SensorAPI): MouseLifecycle {
  return createCaptureLifecycle<Pending, Dragging>({
    getCaptureBindings: ({ stop, startPendingDrag }) => {
      const startCaptureBinding: MouseEventBinding = {
        eventName: 'mousedown',
        fn: function onMouseDown(event: MouseEvent) {
          // Event already used
          if (event.defaultPrevented) {
            return;
          }
          // only starting a drag if dragging with the primary mouse button
          if (event.button !== primaryButton) {
            return;
          }

          // Do not start a drag if any modifier key is pressed
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }

          const draggableId: DraggableId | null =
            api.findClosestDraggableId(event);

          if (!draggableId) {
            return;
          }

          const actions: PreDragActions | null = api.tryGetLock(
            draggableId,
            stop,
            { sourceEvent: event },
          );

          if (!actions) {
            return;
          }

          // consuming the event
          event.preventDefault();

          const point: Position = {
            x: event.clientX,
            y: event.clientY,
          };

          startPendingDrag(() => ({ type: 'PENDING', point, actions }));
        },
      };

      const preventForcePressBinding: EventBinding = {
        eventName: 'webkitmouseforcewillbegin',
        fn: (event: Event) => {
          if (event.defaultPrevented) {
            return;
          }

          const id: DraggableId | null = api.findClosestDraggableId(event);

          if (!id) {
            return;
          }

          const options: DraggableOptions | null =
            api.findOptionsForDraggable(id);

          if (!options) {
            return;
          }

          if (options.shouldRespectForcePress) {
            return;
          }

          if (!api.canGetLock(id)) {
            return;
          }

          event.preventDefault();
        },
      };

      return [preventForcePressBinding, startCaptureBinding];
    },
    getDragBindingGroups: (lifecycle) => [getDragBindings(lifecycle)],
  });
}

export default function useMouseSensor(api: SensorAPI) {
  const lifecycle: MouseLifecycle = useMemo(
    () => createMouseLifecycle(api),
    [api],
  );

  useLayoutEffect(
    function mount() {
      // unmount 때 window binding만 해제한다. Phase는 건드리지 않는다.
      return lifecycle.mount();
    },
    [lifecycle],
  );
}
