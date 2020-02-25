import * as React from 'react';
import { ChessInstance, Move, Square as TSquare } from 'chess.js';

import { Square, SquareHighlight } from './Square';

import css from './Board.css';

interface BoardProps {
  chess: ChessInstance;
  onMove?: (move: Move) => void;
}

function getMovesByTarget(
  chess: ChessInstance,
  square: TSquare,
): Record<string, Move> {
  const moves = chess.moves({
    verbose: true,
    square: square,
  });
  const movesByTarget: Record<string, Move> = {};
  moves.forEach(move => {
    if (move.to in movesByTarget) {
      console.error(
        `Multiple moves from ${square} to ${move.to}: ` +
          `${movesByTarget[move.to].san} and ${move.san}`,
      );
    }
    movesByTarget[move.to] = move;
  });
  return movesByTarget;
}

export function Board(props: BoardProps): JSX.Element {
  const { chess } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [offsetLeft, setOffsetLeft] = React.useState(0);
  const [offsetTop, setOffsetTop] = React.useState(0);
  const [selectedSquare, setSelectedSquare] = React.useState<TSquare | null>(
    null,
  );
  const [
    deselectingSquare,
    setDeselectingSquare,
  ] = React.useState<TSquare | null>(null);
  const [hoveredSquare, setHoveredSquare] = React.useState<TSquare | null>(
    null,
  );
  React.useEffect(() => {
    const setDimensions = (): void => {
      if (ref.current != null) {
        setWidth(Math.min(ref.current.clientWidth, ref.current.clientHeight));
        setOffsetLeft(ref.current.offsetLeft);
        setOffsetTop(ref.current.offsetTop);
      }
    };
    setDimensions();
    window.addEventListener('resize', setDimensions);
    return (): void => {
      window.removeEventListener('resize', setDimensions);
    };
  }, [ref]);

  // For some reason, DOM events on the squares are unstable.  There are a few
  // pixels near the boundary where pointer events will alternate between
  // the two squares, e.g. e3 and e4 when moving the mouse along that boundary.
  // Instead, we calculate the square on our own from the event coordinates
  // which are stable.
  const computeSquare = React.useCallback(
    (clientX: number, clientY: number): TSquare => {
      // Not sure if this is a React bug or intentional, but clientX and
      // clientY are offset and don't start at (0,0)
      const x = clientX - offsetLeft;
      const y = clientY - offsetTop;
      const xIdx = Math.max(0, Math.min(7, Math.floor((8 * x) / width)));
      const yIdx = Math.max(0, Math.min(7, Math.floor((8 * y) / width)));
      const rank = 8 - yIdx;
      const f = xIdx + 1;
      const file = String.fromCharCode('a'.charCodeAt(0) + f - 1);
      return (file + rank) as TSquare;
    },
    [width, offsetLeft, offsetTop],
  );

  const movesByTarget: Record<string, Move> =
    selectedSquare === null ? {} : getMovesByTarget(chess, selectedSquare);

  const makeMove = React.useCallback(
    (square: TSquare) => {
      if (square !== hoveredSquare) {
        console.error(
          `Moving piece ${square} instead of indicated ${hoveredSquare}`,
        );
      }
      const move = movesByTarget[square];
      const onMove = props.onMove;
      if (onMove) {
        onMove(move);
      }
      setSelectedSquare(null);
      setHoveredSquare(null);
    },
    [movesByTarget, props.onMove, hoveredSquare],
  );

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const square = computeSquare(e.clientX, e.clientY);
      const piece = chess.get(square);
      if (square === selectedSquare) {
        // We want to toggle the square if it is currently select, but we
        // cannot do this immediately in case this pointerdown is the start
        // of a drag.  Instead, note what we're doing and finish the toggle
        // in onPointerUp.
        setDeselectingSquare(square);
      } else if (square in movesByTarget) {
        // Move the piece
        makeMove(square);
      } else if (piece && piece.color === chess.turn()) {
        // Select any square with a piece owned by the current player
        setSelectedSquare(square);
        setHoveredSquare(null);
      } else {
        setSelectedSquare(null);
        setHoveredSquare(null);
      }
    },
    [computeSquare, selectedSquare, movesByTarget, makeMove, chess],
  );
  const onPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      const square = computeSquare(e.clientX, e.clientY);
      // Toggle square if it is currently selected.  Handle this separately
      // from onPointerDown if we want to drag the currently selected square
      // so we do not deselect it before dragging.
      if (square === deselectingSquare) {
        // Toggle the already selected square
        setSelectedSquare(null);
      }
      setDeselectingSquare(null);
    },
    [computeSquare, deselectingSquare],
  );
  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      const square = computeSquare(e.clientX, e.clientY);
      if (square in movesByTarget) {
        // Move the piece
        makeMove(square);
      }
    },
    [computeSquare, movesByTarget, makeMove],
  );

  const onHover = React.useCallback(
    (clientX: number, clientY: number) => {
      const square = computeSquare(clientX, clientY);
      if (square in movesByTarget) {
        setHoveredSquare(square);
      } else {
        setHoveredSquare(null);
      }
    },
    [computeSquare, movesByTarget],
  );
  const onDrag = React.useCallback(
    (e: React.DragEvent) => onHover(e.clientX, e.clientY),
    [onHover],
  );
  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => onHover(e.clientX, e.clientY),
    [onHover],
  );
  const onPointerLeave = React.useCallback(() => setHoveredSquare(null), []);

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
          approxWidth={Math.floor(width / 8)}
          highlight={highlight}
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
  const style = {
    width: width + 'px',
    height: width + 'px',
  };
  return (
    <div ref={ref} className={css.container}>
      <div
        className={css.board}
        style={style}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onDrag={onDrag}
        onDrop={onDrop}
      >
        {ranks}
      </div>
    </div>
  );
}
