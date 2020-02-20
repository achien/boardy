import * as React from 'react';
import { Piece } from 'chess.js';

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
  color: 'black' | 'white';
  highlighted: boolean;
  piece: Piece | null;
}

export function Square(props: SquareProps): any {
  let icon = null;
  const iconRef = React.useRef(null);
  const piece = props.piece;
  if (piece !== null) {
    const iconSrc = PIECES[piece.color][piece.type];
    const onDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setDragImage(
        iconRef.current,
        props.approxWidth / 2,
        props.approxWidth / 2,
      );
    };

    const iconStyle = {
      backgroundImage: `url(${iconSrc})`,
    };
    icon = (
      <div
        ref={iconRef}
        className={css.piece}
        style={iconStyle}
        draggable="true"
      />
    );
  }

  const style = {
    backgroundColor: props.color === 'black' ? COLORS.black : COLORS.white,
    filter: props.highlighted ? 'hue-rotate(180deg)' : null,
    color: props.piece && props.piece.color === 'w' ? 'white' : 'black',
  };
  return (
    <div className={css.square} style={style}>
      {icon}
    </div>
  );
}
