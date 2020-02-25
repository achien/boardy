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
  const [engine, _setEngine] = React.useState(
    new Engine('stockfish', STOCKFISH_PATH),
  );
  // const [engine, _setEngine] = React.useState(
  //   new Engine('chessey', CHESSEY_PATH),
  // );
  React.useEffect(() => {
    (async (): Promise<void> => {
      await engine.start();
      await engine.ready();
      engine.newGame();
    })();
    const cleanup = (): void => {
      engine.quit();
    };
    window.addEventListener('beforeUnload', cleanup);
    return (): void => {
      cleanup();
      window.removeEventListener('beforeUnload', cleanup);
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

  // Responsive layout
  //
  // +--------------------+----------------+
  // |     left pane      |   right pane   |
  // |+------------------+|                |
  // ||                  ||                |
  // ||                  ||                |
  // ||      board       ||                |
  // ||                  ||                |
  // ++------------------+|                |
  // || bottom left pane ||                |
  // ++------------------+|                |
  // +--------------------+----------------+
  //
  // Board is square.  We maximize board area assuming right pane has a fixed
  // width and bottom left pane has a fixed height.
  const playRef = React.useRef<HTMLDivElement>();
  const boardContainerRef = React.useRef<HTMLDivElement>(null);
  const bottomLeftPaneRef = React.useRef<HTMLDivElement>(null);
  const rightPaneRef = React.useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = React.useState(0);
  const setDimensions = React.useCallback((): void => {
    if (
      playRef.current == null ||
      boardContainerRef.current == null ||
      bottomLeftPaneRef.current == null ||
      rightPaneRef.current == null
    ) {
      return;
    }
    const playRect = playRef.current.getBoundingClientRect();
    const bottomLeftRect = bottomLeftPaneRef.current.getBoundingClientRect();
    const rightRect = rightPaneRef.current.getBoundingClientRect();
    const boardWidth = Math.min(
      playRect.width - rightRect.width,
      playRect.height - bottomLeftRect.height,
    );
    boardContainerRef.current.style.width = boardWidth + 'px';
    boardContainerRef.current.style.height = boardWidth + 'px';
    setBoardWidth(boardWidth);
  }, [playRef, boardContainerRef, bottomLeftPaneRef, rightPaneRef]);
  // We need this in addition to useEffect below because refs are set after
  // rendering, and we want to resize after the first render.
  const setPlayRef = React.useCallback(
    (playNode: HTMLDivElement) => {
      playRef.current = playNode;
      setDimensions();
    },
    [playRef, setDimensions],
  );
  React.useEffect(() => {
    window.addEventListener('resize', setDimensions);
    return (): void => {
      window.removeEventListener('resize', setDimensions);
    };
  }, [setDimensions]);

  const boardContainerStyle = {
    width: boardWidth + 'px',
    height: boardWidth + 'px',
  };

  return (
    <div ref={setPlayRef} className={css.play}>
      <div className={css.leftPane}>
        <div
          ref={boardContainerRef}
          className={css.boardContainer}
          style={boardContainerStyle}
        >
          <Board chess={position.chess} onMove={onMove} />
        </div>
        <div ref={bottomLeftPaneRef} className={css.bottomLeftPane}>
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
      </div>
      <div ref={rightPaneRef} className={css.rightPane}>
        <ClockDisplay clock={clock} color={'black'} />
        <ClockDisplay clock={clock} color={'white'} />
      </div>
    </div>
  );
}
