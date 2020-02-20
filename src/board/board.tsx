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
  const [deselectingSquare, setDeselectingSquare] = React.useState(null);
  const [hoveredSquare, setHoveredSquare] = React.useState(null);

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
        `Multiple moves from ${selectedSquare} to ${move.to}: ` +
          `${movesByTarget[move.to].san} and ${move.san}`,
      );
    }
    movesByTarget[move.to] = move;
  });

  const onPointerDown = React.useCallback(
    (square: TSquare) => {
      const piece = chess.get(square);
      if (square === selectedSquare) {
        // We want to toggle the square if it is currently select, but we
        // cannot do this immediately in case this pointerdown is the start
        // of a drag.  Instead, note what we're doing and finish the toggle
        // in onPointerUp.
        setDeselectingSquare(square);
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
  const onPointerUp = React.useCallback(
    (square: TSquare) => {
      // Toggle square if it is currently selected.  Handle this separately
      // from onPointerDown if we want to drag the currently selected square
      // so we do not deselect it before dragging.
      if (square === deselectingSquare) {
        // Toggle the already selected square
        setSelectedSquare(null);
      }
      setDeselectingSquare(null);
    },
    [deselectingSquare],
  );
  const onDrop = React.useCallback(
    (square: TSquare) => {
      if (square in movesByTarget) {
        // Move the piece
        chess.move(movesByTarget[square]);
        setSelectedSquare(null);
      }
    },
    [movesByTarget, chess],
  );

  const onHoverEnter = React.useCallback(
    (square: TSquare) => {
      if (square in movesByTarget) {
        setHoveredSquare(square);
      }
    },
    [movesByTarget],
  );
  const onHoverLeave = React.useCallback(
    (square: TSquare) => {
      if (square === hoveredSquare) {
        setHoveredSquare(null);
      }
    },
    [hoveredSquare],
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
      } else if (square === hoveredSquare) {
        highlight = 'hovered';
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
          onPointerUp={onPointerUp}
          onPointerEnter={onHoverEnter}
          onPointerLeave={onHoverLeave}
          onDragEnter={onHoverEnter}
          onDragLeave={onHoverLeave}
          onDrop={onDrop}
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
