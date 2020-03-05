import * as assert from 'assert';

import Chess, { ChessInstance, ShortMove } from 'chess.js';

interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: string;
}

function getGameResult(chess: ChessInstance): GameResult | null {
  if (chess.in_checkmate()) {
    return {
      winner: chess.turn() == 'w' ? 'black' : 'white',
      reason: 'Checkmate',
    };
  } else if (chess.in_stalemate()) {
    return {
      winner: 'draw',
      reason: 'Stalemate',
    };
  } else if (chess.insufficient_material()) {
    return {
      winner: 'draw',
      reason: 'Insufficient Material',
    };
  } else if (chess.in_threefold_repetition()) {
    return {
      winner: 'draw',
      reason: 'Threefold Repetition',
    };
  } else if (chess.in_draw()) {
    return {
      winner: 'draw',
      reason: 'Draw',
    };
  }
  assert(!chess.game_over(), 'Unhandled chess game over state: ' + chess.fen());
  return null;
}

export class Position {
  initialFen: string;
  chess: ChessInstance;
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

  move(move: string | ShortMove): Position {
    assert(!this.isGameOver(), 'Trying to make move after game has ended');

    const nextPosition = this.clone();

    // UCI uses long algebraic which is "sloppy"
    nextPosition.chess.move(move, { sloppy: true });
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
