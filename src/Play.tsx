import * as React from 'react';

import Chess, { Move } from 'chess.js';

import { Board } from './board/Board';
import { Clock } from './Clock';
import { Position } from './Position';
import { TimeControl } from './TimeControl';

import css from './Play.css';
import { Engine } from './uci';

const TIME = 60;
const INCREMENT = 1;
const STOCKFISH_PATH =
  '/Users/andrewchien/Downloads/stockfish-11-mac/Mac/stockfish-11-modern';

export function Play(): JSX.Element {
  const [engine, _] = React.useState(new Engine('stockfish', STOCKFISH_PATH));
  const [position, setPosition] = React.useState(new Position());
  const [time, _setTime] = React.useState(
    new TimeControl({
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
      time.press();
      if (newPosition.chess.turn() === 'b') {
        engine.position(newPosition).play(time);
      }
    },
    [position, time, engine],
  );
  const moveListener = React.useCallback(
    (move: string): void => {
      setPosition(position.move(move));
      time.press();
    },
    [position, time],
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
        <Clock timeControl={time} color={'black'} />
        <Clock timeControl={time} color={'white'} />
      </div>
    </div>
  );
}
