import * as React from 'react';
import { ChessInstance, Square as TSquare, Move } from 'chess.js';

import { Square, SquareHighlight } from './square';

interface BoardProps {
  width: number;
  chess: ChessInstance;
}

export function Board(props: BoardProps): JSX.Element {
  const { chess } = props;
  const [selectedSquare, setSelectedSquare] = React.useState(null);

  const movesFromSelected =
    selectedSquare === null
      ? []
      : chess.moves({
          verbose: true,
          square: selectedSquare,
        });
  const movesByTarget: Record<string, Move> = {};
  movesFromSelected.forEach(move => {
    if (move.to in movesByTarget) {
      console.error(
        'Multiple moves from ' +
          selectedSquare +
          ' to ' +
          move.to +
          ': ' +
          movesByTarget[move.to].san +
          ' and ' +
          move.san,
      );
    }
    movesByTarget[move.to] = move;
  });

  const onPointerDown = React.useCallback(
    (square: TSquare) => {
      const piece = chess.get(square);
      if (square === selectedSquare) {
        // Toggle the already selected square
        setSelectedSquare(null);
      } else if (square in movesByTarget) {
        // Move the piece
        chess.move(movesByTarget[square]);
        setSelectedSquare(null);
      } else if (piece && piece.color === chess.turn()) {
        // Select any square with a piece owned by the current player
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    },
    [selectedSquare, movesByTarget, chess],
  );

  const ranks = [];
  for (let rank = 8; rank >= 1; rank--) {
    const rankSquares = [];
    for (let f = 1; f <= 8; f++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + f - 1);
      const square = (file + rank) as TSquare;
      let highlight: SquareHighlight = null;
      if (square === selectedSquare) {
        highlight = 'selected';
      } else if (square in movesByTarget) {
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
