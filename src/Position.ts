import * as assert from 'assert';

import Chess, { ChessInstance, ShortMove } from 'chess.js';

export class Position {
  initialFen: string | null;
  chess: ChessInstance;

  constructor(initialFen: string | null = null) {
    this.initialFen = initialFen;
    if (initialFen != null) {
      this.chess = new Chess(initialFen);
    } else {
      this.chess = new Chess();
    }
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
    const nextPosition = this.clone();
    // UCI uses long algebraic which is "sloppy"
    nextPosition.chess.move(move, { sloppy: true });
    assert(nextPosition.chess.turn() !== this.chess.turn());
    return nextPosition;
  }
}
