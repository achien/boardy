import * as React from 'react';
import classNames from 'classnames';
import { ChessInstance, Square as TSquare, Piece } from 'chess.js';

import css from './Square.css';

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
  // chessboard.js, Lichess
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

const SELECTED_FILTER = 'hue-rotate(60deg) brightness(50%)';

export type SquareHighlight = null | 'selected' | 'targeted' | 'hovered';

interface SquareProps {
  chess: ChessInstance;
  square: TSquare;
  // board width / 8.  Not exact since we use flexbox to syle.
  approxWidth: number;
  highlight: SquareHighlight;
}

interface PieceProps {
  piece: Piece;
  draggable: boolean;
  approxWidth: number;
}

function Piece(props: PieceProps): JSX.Element {
  const [isDragging, setIsDragging] = React.useState(false);
  const iconRef = React.useRef<HTMLDivElement>(null);

  const onDragStart = React.useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      // Center the piece on the mouse while dragging
      const iconElem = iconRef.current;
      if (iconElem != null) {
        e.dataTransfer.setDragImage(
          iconElem,
          props.approxWidth / 2,
          props.approxWidth / 2,
        );
      }
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
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    />
  );
}

export function Square(props: SquareProps): JSX.Element {
  const { chess, square } = props;

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

  const squareColor = COLORS[chess.square_color(square)];
  let target = null;
  if (props.highlight === 'targeted') {
    if (chess.get(square) != null) {
      // Render triangular borders on a square with a piece
      const gradientColors = `${squareColor} 10%, transparent 10%`;
      const targetStyle = {
        filter: SELECTED_FILTER,
        background:
          `linear-gradient(to bottom left, ${gradientColors}), ` +
          `linear-gradient(to bottom right, ${gradientColors}), ` +
          `linear-gradient(to top left, ${gradientColors}), ` +
          `linear-gradient(to top right, ${gradientColors})`,
      };
      target = <div className={css.target} style={targetStyle} />;
    } else {
      // Render a dot on an empty square
      const dotStyle = {
        color: squareColor,
        filter: SELECTED_FILTER,
        fontSize: props.approxWidth + 'px',
        lineHeight: props.approxWidth + 'px',
      };
      target = (
        <div className={css.target} style={dotStyle}>
          •
        </div>
      );
    }
  }

  let filter = undefined;
  if (props.highlight === 'selected' || props.highlight === 'hovered') {
    filter = SELECTED_FILTER;
  }
  const backgroudStyle = {
    backgroundColor: squareColor,
    filter: filter,
  };
  return (
    <div className={css.square}>
      <div className={css.squareBackground} style={backgroudStyle} />
      {target}
      {pieceElem}
    </div>
  );
}
