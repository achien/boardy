import * as React from 'react';

import { Position } from './Position';

import styles from './History.css';

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
  const { position } = props;
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const movePairs = historyAsPairs(position);

  // After appending new moves scroll thet game into view
  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [bottomRef, position]);

  const rows = movePairs.map(movePair => {
    const { moveNumber, whiteMove, blackMove } = movePair;
    return (
      <tr key={moveNumber}>
        <td className={styles.moveNumber}>{moveNumber}.</td>
        <td className={styles.move}>{whiteMove ?? '…'}</td>
        <td className={styles.move}>{blackMove}</td>
      </tr>
    );
  });

  let bottom = null;
  if (position.isGameOver()) {
    const gameResult = position.gameResult!;
    let result;
    switch (gameResult.winner) {
      case 'white':
        result = '1-0';
        break;
      case 'black':
        result = '0-1';
        break;
      case 'draw':
        result = '½-½';
        break;
    }
    bottom = (
      <div className={styles.resultContainer}>
        <div className={styles.result}>{result}</div>
        <div className={styles.resultReason}>{gameResult.reason}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <tbody>{rows}</tbody>
      </table>
      <div ref={bottomRef} className={styles.bottom}>
        {bottom}
      </div>
    </div>
  );
}
