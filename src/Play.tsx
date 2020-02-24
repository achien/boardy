import * as React from 'react';

import Chess, { Move } from 'chess.js';

import { Board } from './board/Board';
import { Clock } from './Clock';
import { TimeControl } from './TimeControl';

import css from './Play.css';

export function Play(): JSX.Element {
  const [chess, _setChess] = React.useState(new Chess());
  const [time, _setTime] = React.useState(
    new TimeControl({
      white: 15 * 1000,
      black: 15 * 1000,
      whiteIncrement: 1000,
      blackIncrement: 1000,
    }),
  );
  const [_turn, setTurn] = React.useState<'white' | 'black'>('white');
  const onMove = React.useCallback(
    (move: Move) => {
      chess.move(move);
      time.press();
      // Force rerender by changing state (we only modify internal state of
      // chess which is not checked by React)
      setTurn(time.getTurn());
    },
    [chess, time],
  );

  return (
    <div className={css.play}>
      <div className={css.boardContainer}>
        <Board chess={chess} onMove={onMove} />
      </div>
      <div className={css.rightPane}>
        <Clock timeControl={time} color={'black'} />
        <Clock timeControl={time} color={'white'} />
      </div>
    </div>
  );
}
