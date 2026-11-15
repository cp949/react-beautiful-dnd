import type { Position } from 'css-box-model';
import { bindActionCreators, Dispatch as ReduxDispatch } from 'redux';
import type { Dispatch } from '../../src/state/store-types';
import create from '../../src/state/dimension-marshal/dimension-marshal';
import type {
  CollectionStartingAction,
  PublishWhileDraggingAction,
  PublishWhileDraggingArgs,
  UpdateDroppableScrollAction,
  UpdateDroppableScrollArgs,
  UpdateDroppableIsEnabledAction,
  UpdateDroppableIsEnabledArgs,
  UpdateDroppableIsCombineEnabledAction,
  UpdateDroppableIsCombineEnabledArgs,
} from '../../src/state/action-creators';
import type { DroppableId, LiftRequest } from '../../src/types';
import {
  collectionStarting,
  publishWhileDragging,
  updateDroppableScroll,
  updateDroppableIsEnabled,
  updateDroppableIsCombineEnabled,
} from '../../src/state/action-creators';
import type {
  DimensionMarshal,
  StartPublishingResult,
} from '../../src/state/dimension-marshal/dimension-marshal-types';
import type { Registry } from '../../src/state/registry/registry-types';
import { critical, preset } from './preset-action-args';

export const createMarshal = (
  registry: Registry,
  dispatch: Dispatch,
): DimensionMarshal => {
  const callbacks = bindActionCreators(
    {
      publishWhileDragging,
      collectionStarting,
      updateDroppableScroll,
      updateDroppableIsEnabled,
      updateDroppableIsCombineEnabled,
    },
    // Redux types are not optimal. They should pass the Action to the Dispatch, but
    // instead they directly use the Dispatch which end up to be Dispatch<AnyAction>.
    // The type should be like this instead.
    // TODO: Open a PR to fix the issue.
    //
    // ```ts
    // export function bindActionCreators<A, C extends ActionCreator<A>>(
    //   actionCreator: C,
    //   dispatch: Dispatch<A>
    // ): C
    // ```
    //
    // See: https://github.com/reduxjs/redux/blob/83af794b06ca253c03235f28d1d3a33d8eba2b6f/index.d.ts#L568
    dispatch as ReduxDispatch,
  );

  return create(registry, callbacks);
};

export const getMarshalStub = () => ({
  updateDroppableScroll:
    vi.fn<(...args: [id: string, newScroll: Position]) => void>(),
  updateDroppableIsEnabled:
    vi.fn<(...args: [id: DroppableId, isEnabled: boolean]) => void>(),
  updateDroppableIsCombineEnabled:
    vi.fn<(...args: [id: DroppableId, isEnabled: boolean]) => void>(),
  scrollDroppable:
    vi.fn<(...args: [id: DroppableId, change: Position]) => void>(),
  startPublishing: vi.fn<(...args: [LiftRequest]) => StartPublishingResult>(
    () => ({
      critical,
      viewport: preset.viewport,
      dimensions: {
        draggables: {
          [preset.inHome1.descriptor.id]: preset.inHome1,
          [preset.inHome2.descriptor.id]: preset.inHome2,
        },
        droppables: {
          [preset.home.descriptor.id]: preset.home,
        },
      },
    }),
  ),
  stopPublishing: vi.fn<(...args: []) => void>(),
});

export const getCallbacksStub = () => ({
  publishWhileDragging:
    vi.fn<(...args: [PublishWhileDraggingArgs]) => PublishWhileDraggingAction>(
      publishWhileDragging,
    ),
  updateDroppableScroll: vi.fn<
    (...args: [UpdateDroppableScrollArgs]) => UpdateDroppableScrollAction
  >(updateDroppableScroll),
  updateDroppableIsEnabled: vi.fn<
    (...args: [UpdateDroppableIsEnabledArgs]) => UpdateDroppableIsEnabledAction
  >(updateDroppableIsEnabled),
  updateDroppableIsCombineEnabled: vi.fn<
    (
      ...args: [UpdateDroppableIsCombineEnabledArgs]
    ) => UpdateDroppableIsCombineEnabledAction
  >(updateDroppableIsCombineEnabled),
  collectionStarting:
    vi.fn<(...args: []) => CollectionStartingAction>(collectionStarting),
});
