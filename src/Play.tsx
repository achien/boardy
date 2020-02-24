import * as React from 'react';

import Chess, { Move } from 'chess.js';

import { Board } from './board/Board';
import { Clock } from './Clock';
import { Position } from './Position';
import { TimeControl } from './TimeControl';

import css from './Play.css';

export function Play(): JSX.Element {
  const [position, setPosition] = React.useState(new Position());
  const [time, _setTime] = React.useState(
    new TimeControl({
      white: 15 * 1000,
      black: 15 * 1000,
      whiteIncrement: 1000,
      blackIncrement: 1000,
    }),
  );
  const onMove = React.useCallback(
    (move: Move) => {
      setPosition(position.move(move));
      time.press();
    },
    [position, time],
  );

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
