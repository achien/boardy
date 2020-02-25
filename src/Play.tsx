import * as React from 'react';
import * as classNames from 'classnames';

import { Move } from 'chess.js';

import { Board } from './board/Board';
import { Clock } from './Clock';
import { ClockDisplay } from './ClockDisplay';
import { Engine } from './uci';
import { Position } from './Position';
import { StatefulInput } from './StatefulInput';

import css from './Play.css';

const TIME = 60;
const INCREMENT = 1;
const STOCKFISH_PATH =
  '/Users/andrewchien/Downloads/stockfish-11-mac/Mac/stockfish-11-modern';
const CHESSEY_PATH = '/Users/andrewchien/code/chessey/build/chessey';

export function Play(): JSX.Element {
  // const [engine, _setEngine] = React.useState(
  //   new Engine('stockfish', STOCKFISH_PATH),
  // );
  const [engine, _setEngine] = React.useState(
    new Engine('chessey', CHESSEY_PATH),
  );
  const [position, setPosition] = React.useState(new Position());
  const [clock, _setClock] = React.useState(
    new Clock({
      white: TIME * 1000,
      black: TIME * 1000,
      whiteIncrement: INCREMENT * 1000,
      blackIncrement: INCREMENT * 1000,
    }),
  );

  // Setup the engine
  React.useEffect(() => {
    (async (): Promise<void> => {
      await engine.start();
      await engine.ready();
      engine.newGame();
    })();
    return (): void => {
      engine.quit();
    };
  }, [engine]);

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
      engine.newGame();
    },
    [position, engine],
  );

  React.useEffect(() => {
    if (position.chess.turn() === 'b') {
      engine.position(position).play(clock);
    }
  }, [position, engine, clock]);

  const onMove = React.useCallback(
    (move: Move) => {
      console.log('Move!', move);
      setPosition(position.move(move));
      clock.press();
    },
    [position, clock],
  );
  const moveListener = React.useCallback(
    (move: string): void => {
      setPosition(position.move(move));
      clock.press();
    },
    [position, clock],
  );

  React.useEffect(() => {
    engine.events.on('bestmove', moveListener);
    return (): void => {
      engine.events.off('bestmove', moveListener);
    };
  }, [engine, moveListener]);

  return (
    <div className={css.play}>
      <div className={css.leftPane}>
        <div className={css.boardContainer}>
          <Board chess={position.chess} onMove={onMove} />
        </div>
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
      </div>
      <div className={css.rightPane}>
        <ClockDisplay clock={clock} color={'black'} />
        <ClockDisplay clock={clock} color={'white'} />
      </div>
    </div>
  );
}
