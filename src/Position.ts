import * as assert from 'assert';

import { Chess, Move } from 'chess.js';

interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: string;
}

function getGameResult(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) {
    return {
      winner: chess.turn() == 'w' ? 'black' : 'white',
      reason: 'Checkmate',
    };
  } else if (chess.isStalemate()) {
    return {
      winner: 'draw',
      reason: 'Stalemate',
    };
  } else if (chess.isInsufficientMaterial()) {
    return {
      winner: 'draw',
      reason: 'Insufficient Material',
    };
  } else if (chess.isThreefoldRepetition()) {
    return {
      winner: 'draw',
      reason: 'Threefold Repetition',
    };
  } else if (chess.isDraw()) {
    return {
      winner: 'draw',
      reason: 'Draw',
    };
  }
  assert(
    !chess.isGameOver(),
    'Unhandled chess game over state: ' + chess.fen(),
  );
  return null;
}

export class Position {
  initialFen: string;
  chess: Chess;
  gameResult: GameResult | null;

  constructor(initialFen: string | undefined = undefined) {
    if (initialFen != null) {
      this.chess = new Chess(initialFen);
    } else {
      this.chess = new Chess();
    }
    this.initialFen = this.chess.fen();
    this.gameResult = getGameResult(this.chess);
  }

  initialMoveNumber(): number {
    return parseInt(this.initialFen.split(/\s+/)[5], 10);
  }

  clone(): Position {
    const moves = this.chess.history();
    const clone = new Position(this.initialFen);
    for (const move of moves) {
      clone.chess.move(move);
    }
    return clone;
  }

  move(move: string | Move): Position {
    assert(!this.isGameOver(), 'Trying to make move after game has ended');

    const nextPosition = this.clone();

    // UCI uses long algebraic which is "sloppy"
    nextPosition.chess.move(move);
    assert(nextPosition.chess.turn() !== this.chess.turn());

    nextPosition.gameResult = getGameResult(nextPosition.chess);

    return nextPosition;
  }

  flag(color: 'white' | 'black'): Position {
    assert(!this.isGameOver());

    const nextPosition = this.clone();
    nextPosition.gameResult = {
      winner: color === 'white' ? 'black' : 'white',
      reason: 'Time Out',
    };
    return nextPosition;
  }

  isGameOver(): boolean {
    return this.gameResult != null;
  }
}
