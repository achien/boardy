import * as React from 'react';
import { Chess, Move, Square as TSquare } from 'chess.js';

import { PromotionOverlay, PromotionPiece } from './PromotionOverlay';
import { Square, SquareHighlight } from './Square';
import { useDimensions } from '../useDimensions';

import styles from './Board.css';

interface BoardProps {
  chess: Chess;
  canMove?: boolean;
  onMove?: (move: Move) => void;
}

function getMovesByTarget(chess: Chess, square: TSquare): Record<string, Move> {
  const moves = chess.moves({
    verbose: true,
    square: square,
  });
  const movesByTarget: Record<string, Move> = {};
  moves.forEach((move) => {
    if (move.to in movesByTarget) {
      const other = movesByTarget[move.to];
      if (!(move.promotion && other.promotion)) {
        console.error(
          `Multiple non-promotiton moves from ${square} to ${move.to}: ` +
            `${movesByTarget[move.to].san} and ${move.san}`,
        );
      }
    }
    movesByTarget[move.to] = move;
  });
  return movesByTarget;
}

export function Board(props: BoardProps): JSX.Element {
  const { chess } = props;
  const canMove = props.canMove ?? false;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const containerRect = useDimensions(containerRef);
  const [selectedSquare, setSelectedSquare] = React.useState<TSquare | null>(
    null,
  );
  const [deselectingSquare, setDeselectingSquare] =
    React.useState<TSquare | null>(null);
  const [hoveredSquare, setHoveredSquare] = React.useState<TSquare | null>(
    null,
  );
  const [promotionMove, setPromotionMove] = React.useState<Move | null>(null);

  const canInteract = canMove && promotionMove === null;
  const boardWidth =
    containerRect === null
      ? 0
      : Math.min(containerRect.width, containerRect.height);

  // For some reason, DOM events on the squares are unstable.  There are a few
  // pixels near the boundary where pointer events will alternate between
  // the two squares, e.g. e3 and e4 when moving the mouse along that boundary.
  // Instead of listening to events on each square, we calculate the square
  // on our own from the event coordinates which are stable.
  const computeSquare = React.useCallback(
    (clientX: number, clientY: number): TSquare => {
      // Not sure if this is a React bug or intentional, but clientX and
      // clientY are offset and don't start at (0,0)
      const x = clientX - containerRect!.left;
      const y = clientY - containerRect!.top;
      const xIdx = Math.max(0, Math.min(7, Math.floor((8 * x) / boardWidth)));
      const yIdx = Math.max(0, Math.min(7, Math.floor((8 * y) / boardWidth)));
      const rank = 8 - yIdx;
      const file = String.fromCharCode('a'.charCodeAt(0) + xIdx);
      return (file + rank) as TSquare;
    },
    [containerRect, boardWidth],
  );

  const movesByTarget: Record<string, Move> = React.useMemo(
    () =>
      selectedSquare === null ? {} : getMovesByTarget(chess, selectedSquare),
    [selectedSquare, chess],
  );

  React.useEffect(() => {
    if (!canMove) {
      setSelectedSquare(null);
      setHoveredSquare(null);
    }
  }, [canMove]);

  const makeMove = React.useCallback(
    (move: Move) => {
      const onMove = props.onMove;
      if (onMove) {
        onMove(move);
      }
      setSelectedSquare(null);
      setHoveredSquare(null);
    },
    [props.onMove],
  );

  const makeMoveOrPromote = React.useCallback(
    (square: TSquare) => {
      if (square !== hoveredSquare) {
        console.error(
          `Moving piece to ${square} instead of indicated ${hoveredSquare}`,
        );
      }
      const move = movesByTarget[square];
      if (move.promotion) {
        setPromotionMove(move);
      } else {
        makeMove(movesByTarget[square]);
      }
    },
    [hoveredSquare, movesByTarget, makeMove],
  );

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!canInteract) {
        return;
      }
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
        makeMoveOrPromote(square);
      } else if (piece && piece.color === chess.turn()) {
        // Select any square with a piece owned by the current player
        setSelectedSquare(square);
        setHoveredSquare(null);
      } else {
        setSelectedSquare(null);
        setHoveredSquare(null);
      }
    },
    [
      canInteract,
      computeSquare,
      selectedSquare,
      movesByTarget,
      makeMoveOrPromote,
      chess,
    ],
  );
  const onPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!canInteract) {
        return;
      }
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
    [canInteract, computeSquare, deselectingSquare],
  );
  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      if (!canInteract) {
        return;
      }
      const square = computeSquare(e.clientX, e.clientY);
      if (square in movesByTarget) {
        // Move the piece
        makeMoveOrPromote(square);
      }
    },
    [canInteract, computeSquare, movesByTarget, makeMoveOrPromote],
  );

  const onHover = React.useCallback(
    (clientX: number, clientY: number) => {
      // We purposely do not check canInteract here for the promotion
      // overlay case.  In pointerMove, we already ensure that the move
      // target remains hovered in promotion mode.  We want to update the
      // hover state while the promotion overlay is active so things look
      // right after the overlay is closeed.  (Actually right now we
      // unselect/unhighlight when closing the overlay so it doesn't matter,
      // but this was not always thet case.)
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

  const onPromotionOverlayClose = React.useCallback(
    (piece: PromotionPiece | null) => {
      setPromotionMove(null);
      setSelectedSquare(null);
      setHoveredSquare(null);
      if (piece !== null) {
        const move = Object.assign({}, promotionMove);
        move.promotion = piece;
        makeMove(move);
      }
    },
    [promotionMove, makeMove],
  );

  let promotionOverlay = null;
  if (promotionMove !== null) {
    const color = promotionMove.color === 'b' ? 'black' : 'white';
    promotionOverlay = (
      <PromotionOverlay color={color} onClose={onPromotionOverlayClose} />
    );
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
      } else if (square === hoveredSquare) {
        highlight = 'hovered';
      } else if (promotionMove && square === promotionMove.to) {
        // Keep hovered square highlighted underneath the promotion overlay
        highlight = 'hovered';
      } else if (square in movesByTarget) {
        highlight = 'targeted';
      }
      rankSquares.push(
        <Square
          key={square}
          chess={chess}
          square={square}
          highlight={highlight}
          draggable={canInteract}
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
    width: boardWidth + 'px',
    height: boardWidth + 'px',
  };
  return (
    <div ref={containerRef} className={styles.container}>
      <div
        className={styles.board}
        style={style}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onDrag={onDrag}
        onDrop={onDrop}
      >
        {ranks}
        {promotionOverlay}
      </div>
    </div>
  );
}
