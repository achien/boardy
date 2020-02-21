import * as React from 'react';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';

import Chess, { ChessInstance, Move, ShortMove } from 'chess.js';

import { StatefulInput } from './StatefulInput';
import { Board } from './board/Board';

import css from './App.css';

document.addEventListener('dragover', (e: DragEvent) => {
  // Prevent default so dropping is possible.
  // This also removes the animation snapping the piece back to the original
  // square so things are less janky!
  e.preventDefault();
});

class Game {
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

  clone(): Game {
    const moves = this.chess.history();
    const clone = new Game(this.initialFen);
    for (const move of moves) {
      clone.chess.move(move);
    }
    return clone;
  }

  move(move: string | ShortMove): Game {
    const nextGame = this.clone();
    nextGame.chess.move(move);
    return nextGame;
  }
}

function App(): JSX.Element {
  const [game, setGame] = React.useState(new Game());

  const onMove = React.useCallback(
    (move: Move) => {
      setGame(game.move(move));
    },
    [game],
  );

  const onFenInput = React.useCallback(
    (fen: string) => {
      if (fen === game.chess.fen()) {
        // Don't refresh the game if user clicks in and out of the input
        return;
      }
      const valid = game.chess.validate_fen(fen);
      if (!valid.valid) {
        console.warn(`Invalid fen (${valid.error_number}): ${valid.error}`);
        return;
      }
      // Fen changed, let's update the game
      setGame(new Game(fen));
    },
    [game],
  );
  const onPgnInput = React.useCallback(
    (pgn: string) => {
      if (pgn === game.chess.pgn()) {
        // Don't refresh the game if the user clicks in and out of the input
        return;
      }
      const newGame = new Game();
      const valid = newGame.chess.load_pgn(pgn);
      if (!valid) {
        console.warn(`Invalid pgn: ${pgn}`);
        return;
      }
      setGame(newGame);
    },
    [game],
  );

  return (
    <div className={css.app}>
      <div className={css.boardContainer}>
        <Board chess={game.chess} onMove={onMove} />
      </div>
      <div className={css.inputWrapper}>
        <div className={css.inputRow}>
          <label className={css.inputLabel} htmlFor="fen">
            FEN:
          </label>
          <StatefulInput
            value={game.chess.fen()}
            onValueInput={onFenInput}
            id="fen"
            className={classNames(css.input, css.fenInput)}
          />
        </div>
        <div className={css.inputRow}>
          <label className={css.inputLabel} htmlFor="pgn">
            PGN:
          </label>
          <StatefulInput
            type="textarea"
            value={game.chess.pgn()}
            onValueInput={onPgnInput}
            id="pgn"
            className={classNames(css.input, css.pgnInput)}
          />
        </div>
      </div>
    </div>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<App />, root);
