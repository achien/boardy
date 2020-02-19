import * as React from 'react';
import { ChessInstance, Piece, Square as TSquare } from 'chess.js';

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

function Square(props: SquareProps): any {
  const style = {
    flex: 1,
    backgroundColor: props.color === 'black' ? COLORS.black : COLORS.white,
    filter: props.highlighted ? 'hue-rotate(180deg)' : null,
    textAlign: 'center',
    verticalAlign: 'center',
    color: props.piece && props.piece.color === 'w' ? 'white' : 'black',
  };
  let icon = null;
  const piece = props.piece;
  if (piece !== null) {
    const iconStyle = {
      backgroundImage: 'url(' + PIECES[piece.color][piece.type] + ')',
      backgroundSize: 'contain',
      width: '100%',
      height: '100%',
    };
    icon = <div style={iconStyle} />;
  }
  return <div style={style}>{icon}</div>;
}

interface BoardProps {
  width: number;
  chess: ChessInstance;
}

export function Board(props: BoardProps): any {
  const ranks = [];
  for (let rank = 8; rank >= 1; rank--) {
    const rankSquares = [];
    for (let f = 1; f <= 8; f++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + f - 1);
      const square = (file + rank) as TSquare;
      const color = (f + rank) % 2 == 0 ? 'white' : 'black';
      const highlighted = square == 'e3' || square === 'e4';
      rankSquares.push(
        <Square
          key={square}
          approxWidth={Math.floor(props.width / 8)}
          color={color}
          highlighted={highlighted}
          piece={props.chess.get(square)}
        />,
      );
    }
    const rankStyle = {
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
  const boardStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: props.width + 'px',
    height: props.width + 'px',
  };
  return <div style={boardStyle}>{ranks}</div>;
}
