import type { Position } from 'css-box-model';
import { AutoScrollerOptions } from '../../../../../../src/state/auto-scroller/fluid-scroller/auto-scroller-options-types';
import type { DroppableId } from '../../../../../../src/types';

export default (autoScrollerOptions?: AutoScrollerOptions) => {
  const scrollWindow = vi.fn<(...args: [Position]) => void>();
  const scrollDroppable = vi.fn<(...args: [DroppableId, Position]) => void>();

  return {
    scrollWindow,
    scrollDroppable,
    autoScrollerOptions,
  };
};
