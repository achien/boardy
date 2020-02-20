import * as React from 'react';
import { ChessInstance, Square as TSquare } from 'chess.js';

import { Square, SquareHighlight } from './square';

interface BoardProps {
  width: number;
  chess: ChessInstance;
}

export function Board(props: BoardProps): JSX.Element {
  const { chess } = props;
  const [selectedSquare, setSelectedSquare] = React.useState(null);

  const onPointerDown = React.useCallback(
    (square: TSquare) => {
      if (square !== selectedSquare) {
        // Select any square with a piece owned by the current player
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      } else {
        // Toggle the already selected square
        setSelectedSquare(null);
      }
    },
    [selectedSquare, chess],
  );

  const targets = new Set();
  if (selectedSquare !== null) {
    const movesFromSelected = chess.moves({
      verbose: true,
      square: selectedSquare,
    });
    movesFromSelected.forEach(move => targets.add(move.to));
  }

  const ranks = [];
  for (let rank = 8; rank >= 1; rank--) {
    const rankSquares = [];
    for (let f = 1; f <= 8; f++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + f - 1);
      const square = (file + rank) as TSquare;
      let highlight: SquareHighlight = null;
      if (square === selectedSquare) {
        highlight = 'selected';
      } else if (targets.has(square)) {
        highlight = 'targeted';
      }
      rankSquares.push(
        <Square
          key={square}
          chess={chess}
          square={square}
          approxWidth={Math.floor(props.width / 8)}
          highlight={highlight}
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
