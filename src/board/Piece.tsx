import * as React from 'react';
import classNames from 'classnames';
import { Piece } from 'chess.js';

import { useDimensions } from '../useDimensions';

import css from './Piece.css';

import bb from './pieces/cburnett/bb.svg';
import bk from './pieces/cburnett/bk.svg';
import bn from './pieces/cburnett/bn.svg';
import bp from './pieces/cburnett/bp.svg';
import bq from './pieces/cburnett/bq.svg';
import br from './pieces/cburnett/br.svg';
import wb from './pieces/cburnett/wb.svg';
import wk from './pieces/cburnett/wk.svg';
import wn from './pieces/cburnett/wn.svg';
import wp from './pieces/cburnett/wp.svg';
import wq from './pieces/cburnett/wq.svg';
import wr from './pieces/cburnett/wr.svg';

const PIECES: Record<Piece['color'], Record<Piece['type'], string>> = {
  b: {
    b: bb,
    k: bk,
    n: bn,
    p: bp,
    q: bq,
    r: br,
  },
  w: {
    b: wb,
    k: wk,
    n: wn,
    p: wp,
    q: wq,
    r: wr,
  },
};

interface PieceProps {
  piece: Piece;
  draggable: boolean;
}

export function Piece(props: PieceProps): JSX.Element {
  const iconRef = React.useRef<HTMLDivElement>(null);
  const iconRect = useDimensions(iconRef);
  const [isDragging, setIsDragging] = React.useState(false);

  const onDragStart = React.useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      // Center the piece on the mouse while dragging
      const iconElem = iconRef.current;
      if (iconElem !== null && iconRect !== null) {
        e.dataTransfer.setDragImage(
          iconElem,
          iconRect.width / 2,
          iconRect.height / 2,
        );
      }
    },
    [iconRef, iconRect],
  );
  const onDragEnd = React.useCallback(() => setIsDragging(false), []);

  const { piece, draggable } = props;
  const iconStyle = {
    backgroundImage: 'url(' + PIECES[piece.color][piece.type] + ')',
  };
  const iconClass = classNames({
    [css.piece]: true,
    [css.squareOverlay]: true,
    [css.draggable]: draggable,
    [css.dragging]: isDragging,
  });
  return (
    <div
      ref={iconRef}
      className={iconClass}
      style={iconStyle}
      draggable={draggable ? 'true' : 'false'}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    />
  );
}
