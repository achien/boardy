import * as React from 'react';
import { ChessInstance, Square as TSquare } from 'chess.js';

import { Piece } from './Piece';

import css from './Square.css';

const COLORS = {
  // chessboard.js, Lichess
  light: '#f0d9b5',
  dark: '#b58863',
  // Wikipedia (cburnett)
  // light: '#ffce9e',
  // dark: '#d18b47',
};

const SELECTED_FILTER = 'hue-rotate(60deg) brightness(50%)';

export type SquareHighlight = null | 'selected' | 'targeted' | 'hovered';

interface SquareProps {
  chess: ChessInstance;
  square: TSquare;
  highlight: SquareHighlight;
  draggable: boolean;
}

export function Square(props: SquareProps): JSX.Element {
  const { chess, square } = props;

  let piece = null;
  const chessPiece = chess.get(square);
  if (chessPiece !== null) {
    const draggable = props.draggable && chessPiece.color === chess.turn();
    piece = <Piece piece={chessPiece} draggable={draggable} />;
  }

  const squareColor = COLORS[chess.square_color(square)];
  let target = null;
  if (props.highlight === 'targeted') {
    let svg;
    if (chess.get(square) != null) {
      // Render triangular borders on a square with a piece
      svg = (
        <>
          <polygon points="0 0 0 18 18 0" />
          <polygon points="82 0 100 0 100 18" />
          <polygon points="100 82 100 100 82 100" />
          <polygon points="0 82 0 100 18 100" />
        </>
      );
    } else {
      svg = <circle cx="50" cy="50" r="13" />;
    }
    const targetStyle = {
      filter: SELECTED_FILTER,
    };
    target = (
      <div className={css.target} style={targetStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          <g fill={squareColor} strokeWidth="0">
            {svg}
          </g>
        </svg>
      </div>
    );
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
      <div className={css.piece}>{piece}</div>
    </div>
  );
}
