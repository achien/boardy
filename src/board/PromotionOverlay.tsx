import * as React from 'react';

import { Piece } from './Piece';

import css from './PromotionOverlay.css';

export type PromotionPiece = 'q' | 'n' | 'r' | 'b';

interface Props {
  color: 'white' | 'black';
  onClose: (piece: PromotionPiece | null) => void;
}

export function PromotionOverlay(props: Props): JSX.Element {
  const { color, onClose } = props;
  const [
    clickStartPiece,
    setClickStartPiece,
  ] = React.useState<PromotionPiece | null>(null);

  // Track which piece the user started to click on to work around some
  // weirdness in click events.  Click events are fired where the mouse is
  // released, not where it starts.  If the user moves the mouse before
  // we do not want to close the overlay or select the wrong piece.
  const handlePointerDownFor = React.useCallback(
    (piece: PromotionPiece | null) => {
      return (e: React.MouseEvent): void => {
        setClickStartPiece(piece);
        // Stop propagation to prevent overlay from overwriting pieces
        e.stopPropagation();
      };
    },
    [],
  );
  const handleClickFor = React.useCallback(
    (piece: PromotionPiece | null) => {
      return (): void => {
        if (piece === clickStartPiece) {
          onClose(piece);
        }
        setClickStartPiece(null);
      };
    },
    [clickStartPiece, onClose],
  );

  // Escape key also closes the overlay
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') {
        onClose(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return (): void => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const promotionPieces: PromotionPiece[] = ['q', 'n', 'r', 'b'];
  const pieces = [];
  for (const piece of promotionPieces) {
    pieces.push(
      <div key={piece} className={css.piecePositioner}>
        <a
          className={css.piece}
          onPointerDown={handlePointerDownFor(piece)}
          onClick={handleClickFor(piece)}
          data-piece={piece}
        >
          <Piece color={color} piece={piece} draggable={false} />
        </a>
      </div>,
    );
  }

  return (
    <div
      className={css.overlay}
      onPointerDown={handlePointerDownFor(null)}
      onClick={handleClickFor(null)}
    >
      <div className={css.pieces}>{pieces}</div>
    </div>
  );
}
