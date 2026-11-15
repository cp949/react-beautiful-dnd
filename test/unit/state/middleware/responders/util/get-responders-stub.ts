import type { Responders } from '../../../../../../src/types';

export default function getRespondersStub() {
  return {
    onBeforeDragStart:
      vi.fn<(...args: []) => Responders['onBeforeDragStart']>(),
    onDragStart: vi.fn<(...args: []) => Responders['onDragStart']>(),
    onDragUpdate: vi.fn<(...args: []) => Responders['onDragUpdate']>(),
    onDragEnd: vi.fn<(...args: []) => Responders['onDragEnd']>(),
  };
}
