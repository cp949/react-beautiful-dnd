import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';
import { getHandleSelector } from './util';

// Storybook의 jsxDecorator가 story의 render를 한 번 더 호출해 전역 id 카운터가
// 소진되므로 첫 항목이 G1이 아닐 수 있다. 절대 id 대신 화면에서 읽은 id를 비교한다.
// G1이 G13에도 일치하는 부분 일치를 피하려고 id 전체를 추출해 비교한다.
function readId($element: JQuery<HTMLElement>): string {
  const match = /id:(G\d+)/.exec($element.text());
  return match ? match[1] : '';
}

describe('reorder', () => {
  beforeEach(() => {
    cy.visit('/iframe.html?id=examples-single-vertical-list--basic');
  });

  it('should reorder within a list', () => {
    let firstId = '';
    let secondId = '';

    // order: 1, 2
    cy.get(getHandleSelector())
      .eq(0)
      .as('first')
      .then(($element) => {
        firstId = readId($element);
        expect(firstId).to.not.equal('');
      });
    cy.get(getHandleSelector())
      .eq(1)
      .as('second')
      .then(($element) => {
        secondId = readId($element);
        expect(secondId).to.not.equal('');
        expect(secondId).to.not.equal(firstId);
      });

    // reorder operation
    cy.get('@first')
      .focus()
      .trigger('keydown', { keyCode: keyCodes.space })
      // need to re-query for a clone
      .get('@first')
      .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
      // finishing before the movement time is fine - but this looks nice
      .wait(timings.outOfTheWay * 1000)
      .trigger('keydown', { keyCode: keyCodes.space, force: true });

    // we must wait before asserting the new order
    cy.wait(timings.outOfTheWay * 1000);

    // order now 2, 1
    // note: not using get aliases as they where returning incorrect results
    cy.get('@first').should(($element) => {
      expect(readId($element)).to.equal(secondId);
    });

    cy.get('@second').should(($element) => {
      expect(readId($element)).to.equal(firstId);
    });

    // element should maintain focus post drag
    cy.focused().should(($element) => {
      expect(readId($element)).to.equal(firstId);
    });
  });
});
