import * as React from 'react';
import * as assert from 'assert';

import { Position } from './Position';

import css from './History.css';

interface MovePair {
  moveNumber: number;
  whiteMove: string | null;
  blackMove: string | null;
}

function historyAsPairs(position: Position): MovePair[] {
  let moveNumber = position.initialMoveNumber();
  const history = position.chess.history({ verbose: true });
  const pairs: MovePair[] = [];
  for (const move of history) {
    if (move.color === 'w' || pairs.length === 0) {
      pairs.push({ moveNumber, whiteMove: null, blackMove: null });
    }
    if (move.color === 'w') {
      pairs[pairs.length - 1].whiteMove = move.san;
    } else {
      pairs[pairs.length - 1].blackMove = move.san;
      moveNumber++;
    }
  }

  return pairs;
}

interface HistoryProps {
  position: Position;
}

export function History(props: HistoryProps): JSX.Element {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const movePairs = historyAsPairs(props.position);

  // After appending new moves scroll thet game into view
  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [bottomRef, props.position]);

  const rows = movePairs.map(movePair => {
    const { moveNumber, whiteMove, blackMove } = movePair;
    return (
      <tr key={moveNumber}>
        <td className={css.moveNumber}>{moveNumber}.</td>
        <td className={css.move}>{whiteMove ?? '..'}</td>
        <td className={css.move}>{blackMove}</td>
      </tr>
    );
  });

  const chess = props.position.chess;
  let resultReason = null;
  let result = null;
  if (chess.in_checkmate()) {
    result = chess.turn() == 'w' ? '0-1' : '1-0';
    resultReason = 'Checkmate';
  } else if (chess.in_stalemate()) {
    result = '½-½';
    resultReason = 'Stalemate';
  } else if (chess.insufficient_material()) {
    result = '½-½';
    resultReason = 'Insufficient Material';
  } else if (chess.in_threefold_repetition()) {
    result = '½-½';
    resultReason = 'Threefold Repetition';
  } else if (chess.in_draw()) {
    result = '½-½';
    resultReason = 'Draw';
  } else if (chess.game_over()) {
    result = '?-?';
    resultReason = 'Game Over';
  }
  let bottom = null;
  if (result !== null) {
    bottom = (
      <div className={css.resultContainer}>
        <div className={css.result}>{result}</div>
        <div className={css.resultReason}>{resultReason}</div>
      </div>
    );
  }

  return (
    <div className={css.container}>
      <table className={css.table}>
        <tbody>{rows}</tbody>
      </table>
      <div ref={bottomRef} className={css.bottom}>
        {bottom}
      </div>
    </div>
  );
}
