import type { Position } from 'css-box-model';
import { useMemo } from '../../../use-memo-one';
import { invariant } from '../../../invariant';
import type {
  DraggableId,
  SensorAPI,
  PreDragActions,
  FluidDragActions,
} from '../../../types';
import type {
  AnyEventBinding,
  TouchEventBinding,
} from '../../event-bindings/event-types';
import bindEvents from '../../event-bindings/bind-events';
import * as keyCodes from '../../key-codes';
import supportedPageVisibilityEventName from './util/supported-page-visibility-event-name';
import useLayoutEffect from '../../use-isomorphic-layout-effect';
import createCaptureLifecycle from './util/create-capture-lifecycle';
import type {
  CaptureLifecycle,
  CapturePhase,
  DraggingPhase,
  PendingPhase,
} from './util/create-capture-lifecycle';

type TouchWithForce = Touch & {
  force: number;
};

interface Pending extends PendingPhase {
  point: Position;
  longPressTimerId: TimeoutID;
}

interface Dragging extends DraggingPhase {
  hasMoved: boolean;
}

type Phase = CapturePhase<Pending, Dragging>;

type TouchLifecycle = CaptureLifecycle<Pending, Dragging>;

// Decreased from 150 as a work around for an issue for forcepress on iOS
// https://github.com/atlassian/react-beautiful-dnd/issues/1401
export const timeForLongPress = 120;
export const forcePressThreshold = 0.15;

function getWindowBindings({
  cancel,
  getPhase,
}: TouchLifecycle): AnyEventBinding[] {
  return [
    // If the orientation of the device changes - kill the drag
    // https://davidwalsh.name/orientation-change
    {
      eventName: 'orientationchange',
      fn: cancel,
    },
    // some devices fire resize if the orientation changes
    {
      eventName: 'resize',
      fn: cancel,
    },
    // Long press can bring up a context menu
    // need to opt out of this behavior
    {
      eventName: 'contextmenu',
      fn: (event: Event) => {
        // always opting out of context menu events
        event.preventDefault();
      },
    },
    // On some devices it is possible to have a touch interface with a keyboard.
    // On any keyboard event we cancel a touch drag
    {
      eventName: 'keydown',
      fn: (event: KeyboardEvent) => {
        if (getPhase().type !== 'DRAGGING') {
          cancel();
          return;
        }

        // direct cancel: we are preventing the default action
        // indirect cancel: we are not preventing the default action

        // escape is a direct cancel
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
        }
        cancel();
      },
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];
}

// All of the touch events get applied to the drag handle of the touch interaction
// This plays well with the event.target being unmounted during a drag
function getHandleBindings({
  cancel,
  stop: completed,
  getPhase,
}: TouchLifecycle): AnyEventBinding[] {
  return [
    {
      eventName: 'touchmove',
      // Opting out of passive touchmove (default) so as to prevent scrolling while moving
      // Not worried about performance as effect of move is throttled in requestAnimationFrame
      // Using `capture: false` due to a recent horrible firefox bug: https://twitter.com/alexandereardon/status/1125904207184187393
      options: { capture: false },
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();
        // Drag has not yet started and we are waiting for a long press.
        if (phase.type !== 'DRAGGING') {
          cancel();
          return;
        }

        // At this point we are dragging
        phase.hasMoved = true;

        const { clientX, clientY } = event.touches[0];

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        // We need to prevent the default event in order to block native scrolling
        // Also because we are using it as part of a drag we prevent the default action
        // as a sign that we are using the event
        event.preventDefault();
        phase.actions.move(point);
      },
    },
    {
      eventName: 'touchend',
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();
        // drag had not started yet - do not prevent the default action
        if (phase.type !== 'DRAGGING') {
          cancel();
          return;
        }

        // ending the drag
        event.preventDefault();
        phase.actions.drop({ shouldBlockNextClick: true });
        completed();
      },
    },
    {
      eventName: 'touchcancel',
      fn: (event: TouchEvent) => {
        // drag had not started yet - do not prevent the default action
        if (getPhase().type !== 'DRAGGING') {
          cancel();
          return;
        }

        // already dragging - this event is directly ending a drag
        event.preventDefault();
        cancel();
      },
    },
    // Need to opt out of dragging if the user is a force press
    // Only for webkit which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    {
      eventName: 'touchforcechange',
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();

        // needed to use phase.actions
        invariant(phase.type !== 'IDLE');

        // This is not fantastic logic, but it is done to account for
        // and issue with forcepress on iOS
        // Calling event.preventDefault() will currently opt out of scrolling and clicking
        // https://github.com/atlassian/react-beautiful-dnd/issues/1401

        const touch: TouchWithForce | null = event.touches[0] as any;

        if (!touch) {
          return;
        }

        const isForcePress: boolean = touch.force >= forcePressThreshold;

        if (!isForcePress) {
          return;
        }

        const shouldRespect: boolean = phase.actions.shouldRespectForcePress();

        if (phase.type === 'PENDING') {
          if (shouldRespect) {
            cancel();
          }
          // If not respecting we just let the event go through
          // It will not have an impact on the browser until
          // there has been a sufficient time ellapsed
          return;
        }

        // 'DRAGGING'

        if (shouldRespect) {
          if (phase.hasMoved) {
            // After the user has moved we do not allow the dragging item to be force pressed
            // This prevents strange behaviour such as a link preview opening mid drag
            event.preventDefault();
            return;
          }
          // indirect cancel
          cancel();
          return;
        }

        // not respecting during a drag
        event.preventDefault();
      },
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
    // Not adding a cancel on touchstart as this handler will pick up the initial touchstart event
  ];
}

function createTouchLifecycle(api: SensorAPI): TouchLifecycle {
  return createCaptureLifecycle<Pending, Dragging>({
    getCaptureBindings: ({ stop, startPendingDrag, getPhase, setPhase }) => {
      function startDragging() {
        const phase: Phase = getPhase();
        invariant(
          phase.type === 'PENDING',
          `Cannot start dragging from phase ${phase.type}`,
        );

        const actions: FluidDragActions = phase.actions.fluidLift(phase.point);

        setPhase({
          type: 'DRAGGING',
          actions,
          hasMoved: false,
        });
      }

      const startCaptureBinding: TouchEventBinding = {
        eventName: 'touchstart',
        fn: function onTouchStart(event: TouchEvent) {
          // Event already used by something else
          if (event.defaultPrevented) {
            return;
          }

          // We need to NOT call event.preventDefault() so as to maintain as much standard
          // browser interactions as possible.
          // This includes navigation on anchors which we want to preserve

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

          // could not start a drag
          if (!actions) {
            return;
          }

          const touch: Touch = event.touches[0];
          const { clientX, clientY } = touch;
          const point: Position = {
            x: clientX,
            y: clientY,
          };

          // timer는 IDLE 검증을 통과한 뒤에 만든다.
          startPendingDrag(() => ({
            type: 'PENDING',
            point,
            actions,
            longPressTimerId: setTimeout(startDragging, timeForLongPress),
          }));
        },
      };

      return [startCaptureBinding];
    },
    // In prior versions of iOS it was required that touch listeners be added
    // to the handle to work correctly (even if the handle got removed in a portal / clone)
    // In the latest version it appears to be the opposite: for reparenting to work
    // the events need to be attached to the window.
    // For now i'll keep these two functions seperate in case we need to swap it back again
    // Old behaviour:
    // https://gist.github.com/parris/dda613e3ae78f14eb2dc9fa0f4bfce3d
    // https://stackoverflow.com/questions/33298828/touch-move-event-dont-fire-after-touch-start-target-is-removed
    getDragBindingGroups: (lifecycle) => [
      getHandleBindings(lifecycle),
      getWindowBindings(lifecycle),
    ],
    // aborting any pending drag
    cleanupPending: (pending) => clearTimeout(pending.longPressTimerId),
    // need to kill any pending drag start timer
    resetPendingOnUnmount: true,
  });
}

export default function useTouchSensor(api: SensorAPI) {
  const lifecycle: TouchLifecycle = useMemo(
    () => createTouchLifecycle(api),
    [api],
  );

  useLayoutEffect(
    function mount() {
      return lifecycle.mount();
    },
    [lifecycle],
  );

  // This is needed for safari
  // Simply adding a non capture, non passive 'touchmove' listener.
  // This forces event.preventDefault() in dynamically added
  // touchmove event handlers to actually work
  // https://github.com/atlassian/react-beautiful-dnd/issues/1374
  useLayoutEffect(function webkitHack() {
    const unbind = bindEvents(window, [
      {
        eventName: 'touchmove',
        // using a new noop function for each usage as a single `removeEventListener()`
        // call will remove all handlers with the same reference
        // https://codesandbox.io/s/removing-multiple-handlers-with-same-reference-fxe15

        fn: () => {},
        options: { capture: false, passive: false },
      },
    ]);

    return unbind;
  }, []);
}
