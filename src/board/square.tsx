import * as React from 'react';
import classNames from 'classnames';
import { ChessInstance, Square as TSquare, Piece } from 'chess.js';

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
  light: '#f0d9b5',
  dark: '#b58863',
  // Wikipedia (cburnett)
  // light: '#ffce9e',
  // dark: '#d18b47',
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

export type SquareHighlight = null | 'selected' | 'targeted';

interface SquareProps {
  chess: ChessInstance;
  square: TSquare;
  // board width / 8.  Not exact since we use flexbox to syle.
  approxWidth: number;
  highlight: SquareHighlight;
  onPointerDown: (square: TSquare) => void;
}

interface PieceProps {
  piece: Piece;
  draggable: boolean;
  approxWidth: number;
}

function Piece(props: PieceProps): JSX.Element {
  const [isDragging, setIsDragging] = React.useState(false);
  const iconRef = React.useRef(null);

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

  const { piece, draggable } = props;
  const iconStyle = {
    backgroundImage: 'url(' + PIECES[piece.color][piece.type] + ')',
  };
  const iconClass = classNames({
    [css.piece]: true,
    [css.draggable]: draggable,
    [css.dragging]: isDragging,
  });
  return (
    <div
      ref={iconRef}
      className={iconClass}
      style={iconStyle}
      draggable={draggable ? 'true' : 'false'}
      onDragStart={draggable ? onDragStart : null}
      onDragEnd={draggable ? onDragEnd : null}
    />
  );
}

export function Square(props: SquareProps): JSX.Element {
  const { chess, square } = props;

  const onPointerDown = React.useCallback(() => {
    const cb = props.onPointerDown;
    cb(props.square);
  }, [props.square, props.onPointerDown]);

  const onDragOver = React.useCallback((e: React.DragEvent) => {
    // prevent default or else you cannot drop
    e.preventDefault();
  }, []);
  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      console.log('drop', square, e.target, e);
    },
    [square],
  );

  let pieceElem = null;
  const piece = chess.get(square);
  if (piece !== null) {
    const draggable = piece.color === chess.turn();
    pieceElem = (
      <Piece
        piece={piece}
        draggable={draggable}
        approxWidth={props.approxWidth}
      />
    );
  }

  let filter;
  switch (props.highlight) {
    case 'selected':
      filter = 'hue-rotate(60deg)';
      break;
    case 'targeted':
      filter = 'hue-rotate(180deg)';
      break;
    case null:
      filter = null;
      break;
  }
  const style = {
    backgroundColor: COLORS[chess.square_color(square)],
    filter: filter,
  };
  return (
    <div
      className={css.square}
      style={style}
      onPointerDown={onPointerDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {pieceElem}
    </div>
  );
}
