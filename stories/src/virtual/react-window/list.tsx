import React, { ReactElement, useState } from 'react';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import {
  Droppable,
  Draggable,
  DragDropContext,
} from '@cp949/react-beautiful-dnd';

import type {
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
  DraggableRubric,
  DropResult,
} from '@cp949/react-beautiful-dnd';
import type { Quote } from '../../types';

import QuoteItem from '../../primatives/quote-item';
import reorder from '../../reorder';

interface Props {
  initial: Quote[];
}

// react-window 2는 rowProps로 넘긴 값을 row 컴포넌트의 props로 전달한다.
interface RowExtraProps {
  quotes: Quote[];
}

function Row({ quotes, index, style }: RowComponentProps<RowExtraProps>) {
  const quote: Quote = quotes[index];

  return (
    <Draggable draggableId={quote.id} index={index} key={quote.id}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <QuoteItem
          provided={provided}
          quote={quote}
          isDragging={snapshot.isDragging}
          isGroupedOver={Boolean(snapshot.combineTargetFor)}
          style={{ margin: 0, ...style }}
          index={index}
        />
      )}
    </Draggable>
  );
}

function App(props: Props): ReactElement {
  const [quotes, setQuotes] = useState(() => props.initial);

  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }
    if (result.source.index === result.destination.index) {
      return;
    }

    const newQuotes: Quote[] = reorder(
      quotes,
      result.source.index,
      result.destination.index,
    );
    setQuotes(newQuotes);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="droppable"
        mode="virtual"
        renderClone={(
          provided: DraggableProvided,
          snapshot: DraggableStateSnapshot,
          rubric: DraggableRubric,
        ) => (
          <QuoteItem
            provided={provided}
            isDragging={snapshot.isDragging}
            quote={quotes[rubric.source.index]}
            style={{ margin: 0 }}
            index={rubric.source.index}
          />
        )}
      >
        {(droppableProvided: DroppableProvided) => (
          <List
            style={{ height: 500, width: 300 }}
            rowCount={quotes.length}
            rowHeight={100}
            rowComponent={Row}
            rowProps={{ quotes }}
            // 스크롤 컨테이너인 가장 바깥 element를 droppable의 ref로 연결한다.
            listRef={(list) =>
              droppableProvided.innerRef(list?.element ?? null)
            }
          />
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default App;
