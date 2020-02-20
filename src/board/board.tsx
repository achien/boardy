import * as React from 'react';
import { ChessInstance, Square as TSquare } from 'chess.js';

import { Square } from './square';

interface BoardProps {
  width: number;
  chess: ChessInstance;
}

export function Board(props: BoardProps): JSX.Element {
  const ranks = [];
  for (let rank = 8; rank >= 1; rank--) {
    const rankSquares = [];
    for (let f = 1; f <= 8; f++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + f - 1);
      const square = (file + rank) as TSquare;
      const color = (f + rank) % 2 == 0 ? 'white' : 'black';
      const highlighted = square == 'e3' || square === 'e4';
      rankSquares.push(
        <Square
          key={square}
          approxWidth={Math.floor(props.width / 8)}
          color={color}
          highlighted={highlighted}
          piece={props.chess.get(square)}
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
