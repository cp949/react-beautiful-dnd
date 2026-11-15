import { render } from '@testing-library/react';
import React from 'react';
import DragDropContext from '../../../../src/view/drag-drop-context';
import * as attributes from '../../../../src/view/data-attributes';

it('should insert nonce into style tag', () => {
  const nonce = 'ThisShouldBeACryptographicallySecurePseudorandomNumber';

  const { unmount } = render(
    <DragDropContext nonce={nonce} onDragEnd={() => {}}>
      {null}
    </DragDropContext>,
  );
  // useId 형식이 React 버전마다 달라 속성 값은 지정하지 않는다.
  const styleTag = document.querySelector(`[${attributes.prefix}-always]`);
  const nonceAttribute = styleTag ? styleTag.getAttribute('nonce') : '';
  expect(nonceAttribute).toEqual(nonce);

  unmount();
});
