import * as React from 'react';
import classNames from 'classnames';
import { useDrag, DragPreviewImage } from 'react-dnd';
import { Square as TSquare, Piece } from 'chess.js';

import css from './square.css';

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

const COLORS = {
  // chessboard.js
  white: '#f0d9b5',
  black: '#b58863',
  // Wikipedia (cburnett)
  // white: '#ffce9e',
  // black: '#d18b47',
};

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

interface SquareProps {
  // board width / 8.  Not exact since we use flexbox to syle.
  approxWidth: number;
  square: TSquare;
  highlighted: boolean;
  piece: Piece | null;
  onPointerDown: (square: TSquare) => void;
}

export function Square(props: SquareProps): JSX.Element {
  const [isDragging, setIsDragging] = React.useState(false);
  const iconRef = React.useRef(null);

  const onPointerDown = React.useCallback(() => {
    const cb = props.onPointerDown;
    cb(props.square);
  }, [props.square, props.onPointerDown]);

  const onDragStart = React.useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      // Center the piece on the mouse while dragging
      e.dataTransfer.setDragImage(
        iconRef.current,
        props.approxWidth / 2,
        props.approxWidth / 2,
      );
    },
    [iconRef, props.approxWidth],
  );
  const onDragEnd = React.useCallback(() => setIsDragging(false), []);
  const onDragOver = React.useCallback((e: React.DragEvent) => {
    // prevent default or else you cannot drop
    e.preventDefault();
  }, []);
  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      console.log('drop', props.square, e.target, e);
    },
    [props.square],
  );

  let icon = null;
  const piece = props.piece;
  if (piece !== null) {
    const iconStyle = {
      backgroundImage: 'url(' + PIECES[piece.color][piece.type] + ')',
    };
    const iconClass = classNames({
      [css.piece]: true,
      [css.dragging]: isDragging,
    });
    icon = (
      <div
        ref={iconRef}
        className={iconClass}
        style={iconStyle}
        draggable="true"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  const rankIdx = props.square.charCodeAt(0) - 'a'.charCodeAt(0);
  const fileIdx = props.square.charCodeAt(1) - '1'.charCodeAt(0);
  const isWhiteSquare = (rankIdx + fileIdx) % 2 === 0;
  const style = {
    backgroundColor: isWhiteSquare ? COLORS.white : COLORS.black,
    filter: props.highlighted ? 'hue-rotate(180deg)' : null,
    color: props.piece && props.piece.color === 'w' ? 'white' : 'black',
  };
  return (
    <div
      className={css.square}
      style={style}
      onPointerDown={onPointerDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {icon}
    </div>
  );
}
