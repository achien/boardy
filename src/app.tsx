import * as React from 'react';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';

import { Move } from 'chess.js';

import { Board } from './board/Board';
import { Play } from './Play';
import { Position } from './Position';
import { StatefulInput } from './StatefulInput';

import css from './App.css';
import { Engine } from './uci';

import 'typeface-roboto';

document.addEventListener('dragover', (e: DragEvent) => {
  // Prevent default so dropping is possible.
  // This also removes the animation snapping the piece back to the original
  // square so things are less janky!
  e.preventDefault();
});

function App(): JSX.Element {
  const [position, setPosition] = React.useState(new Position());

  const onMove = React.useCallback(
    (move: Move) => {
      setPosition(position.move(move));
    },
    [position],
  );

  const onFenInput = React.useCallback(
    (fen: string) => {
      if (fen === position.chess.fen()) {
        // Don't refresh the position if user clicks in and out of the input
        return;
      }
      const valid = position.chess.validate_fen(fen);
      if (!valid.valid) {
        console.warn(`Invalid fen (${valid.error_number}): ${valid.error}`);
        return;
      }
      // Fen changed, let's update the position
      setPosition(new Position(fen));
    },
    [position],
  );
  const onPgnInput = React.useCallback(
    (pgn: string) => {
      if (pgn === position.chess.pgn()) {
        // Don't refresh the position if the user clicks in and out of the input
        return;
      }
      const newPosition = new Position();
      const valid = newPosition.chess.load_pgn(pgn);
      if (!valid) {
        console.warn(`Invalid pgn: ${pgn}`);
        return;
      }
      setPosition(newPosition);
    },
    [position],
  );

  return <Play />;

  return (
    <div className={css.app}>
      <div className={css.boardContainer}>
        <Board chess={position.chess} onMove={onMove} />
      </div>
      <div className={css.inputWrapper}>
        <div className={css.inputRow}>
          <label className={css.inputLabel} htmlFor="fen">
            FEN:
          </label>
          <StatefulInput
            value={position.chess.fen()}
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
            value={position.chess.pgn()}
            onValueInput={onPgnInput}
            id="pgn"
            className={classNames(css.input, css.pgnInput)}
          />
        </div>
      </div>
    </div>
  );
}

(async function(): Promise<void> {
  const stockfish = new Engine(
    'stockfish',
    '/Users/andrewchien/Downloads/stockfish-11-mac/Mac/stockfish-11-modern',
  );
  await stockfish.start();
  console.warn('Stockfish loaded');
  console.log(stockfish.options);
  await stockfish.ready();
  await stockfish.ready();
  await stockfish.ready();

  ReactDOM.render(<App />, document.body);
})();
