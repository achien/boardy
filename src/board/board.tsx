import * as React from 'react';
import { ChessInstance, Square as TSquare } from 'chess.js';

import { Square } from './square';

interface BoardProps {
  width: number;
  chess: ChessInstance;
}

export function Board(props: BoardProps): JSX.Element {
  const [selectedSquare, setSelectedSquare] = React.useState(null);

  // Select any square that has a piece on it
  const onPointerDown = React.useCallback(
    (square: TSquare) => {
      if (square !== selectedSquare) {
        if (props.chess.get(square) === null) {
          setSelectedSquare(null);
        } else {
          setSelectedSquare(square);
        }
      }
    },
    [selectedSquare, props.chess],
  );

  const ranks = [];
  for (let rank = 8; rank >= 1; rank--) {
    const rankSquares = [];
    for (let f = 1; f <= 8; f++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + f - 1);
      const square = (file + rank) as TSquare;
      rankSquares.push(
        <Square
          key={square}
          square={square}
          approxWidth={Math.floor(props.width / 8)}
          highlighted={square === selectedSquare}
          piece={props.chess.get(square)}
          onPointerDown={onPointerDown}
        />,
      );
    }
    const rankStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      flex: 1,
    };
    ranks.push(
      <div key={rank} style={rankStyle}>
        {rankSquares}
      </div>,
    );
  }
  const boardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: props.width + 'px',
    height: props.width + 'px',
  };
  return <div style={boardStyle}>{ranks}</div>;
}
