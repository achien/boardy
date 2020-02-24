import * as React from 'react';

import { Move } from 'chess.js';

import { Board } from './board/Board';
import { ClockDisplay } from './ClockDisplay';
import { Position } from './Position';
import { Clock } from './Clock';

import css from './Play.css';
import { Engine } from './uci';

const TIME = 60;
const INCREMENT = 1;
const STOCKFISH_PATH =
  '/Users/andrewchien/Downloads/stockfish-11-mac/Mac/stockfish-11-modern';

export function Play(): JSX.Element {
  const [engine, _setEngine] = React.useState(
    new Engine('stockfish', STOCKFISH_PATH),
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
  }, [engine]);

  const onMove = React.useCallback(
    (move: Move) => {
      console.log('Move!', move);
      const newPosition = position.move(move);
      setPosition(position.move(move));
      clock.press();
      if (newPosition.chess.turn() === 'b') {
        engine.position(newPosition).play(clock);
      }
    },
    [position, clock, engine],
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
      <div className={css.boardContainer}>
        <Board chess={position.chess} onMove={onMove} />
      </div>
      <div className={css.rightPane}>
        <ClockDisplay clock={clock} color={'black'} />
        <ClockDisplay clock={clock} color={'white'} />
      </div>
    </div>
  );
}
