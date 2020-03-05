import * as React from 'react';
import * as classNames from 'classnames';
import { Move } from 'chess.js';

import { Board } from './board/Board';
import { Clock, TimeControl } from './Clock';
import { ClockDisplay } from './ClockDisplay';
import { Engine } from './uci';
import { History } from './History';
import { Position } from './Position';
import { StatefulInput } from './StatefulInput';
import { useDimensions } from './useDimensions';

import css from './Play.css';

interface HumanPlayer {
  readonly type: 'human';
  readonly name: string;
}

interface ComputerPlayer {
  readonly type: 'computer';
  readonly engine: Engine;
}

type Player = HumanPlayer | ComputerPlayer;

const ENGINES = {
  Stockfish:
    '/Users/andrewchien/Downloads/stockfish-11-mac/Mac/stockfish-11-modern',
  Chessey: '/Users/andrewchien/code/chessey/build/chessey',
  Chessier: '/Users/andrewchien/code/chessier/target/debug/chessier',
};

export function makeComputerPlayer(name: keyof typeof ENGINES): ComputerPlayer {
  return {
    type: 'computer',
    engine: new Engine(name, ENGINES[name]),
  };
}

export function makeHumanPlayer(name: string): HumanPlayer {
  return {
    type: 'human',
    name,
  };
}

function usePlayer(
  player: Player,
  color: 'white' | 'black',
  position: Position,
  setPosition: React.Dispatch<React.SetStateAction<Position>>,
  clock: Clock,
): void {
  // Setup the engine
  React.useEffect(() => {
    if (player.type !== 'computer') {
      return;
    }
    const engine = player.engine;
    (async (): Promise<void> => {
      await engine.start();
      await engine.ready();
      engine.newGame();
    })();
    const cleanup = (): void => {
      engine.quit();
    };
    window.addEventListener('beforeunload', cleanup);
    return (): void => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [player]);

  // Have the engine play when it's their turn
  React.useEffect(() => {
    if (player.type !== 'computer') {
      return;
    }
    const engine = player.engine;
    const chessJsColor = color === 'white' ? 'w' : 'b';
    if (!position.isGameOver() && position.chess.turn() === chessJsColor) {
      engine.position(position).play(clock);
    }
  }, [player, color, position, clock]);

  // Make the engine's move
  React.useEffect(() => {
    if (player.type !== 'computer') {
      return;
    }
    const engine = player.engine;
    const handleBestMove = (move: string): void => {
      setPosition(position.move(move));
      clock.press();
    };
    engine.events.on('bestmove', handleBestMove);
    return (): void => {
      engine.events.off('bestmove', handleBestMove);
    };
  }, [player, position, setPosition, clock]);
}

interface Props {
  timeControl: TimeControl;
  whitePlayer: Player;
  blackPlayer: Player;
}

export function Play(props: Readonly<Props>): JSX.Element {
  const { timeControl, whitePlayer, blackPlayer } = props;
  const [position, setPosition] = React.useState(new Position());
  const [clock, setClock] = React.useState(new Clock(timeControl));
  usePlayer(whitePlayer, 'white', position, setPosition, clock);
  usePlayer(blackPlayer, 'black', position, setPosition, clock);

  const onFenInput = React.useCallback(
    (fen: string, type: 'explicit' | 'implicit') => {
      fen = fen.trim();
      if (type === 'implicit' && fen === position.chess.fen()) {
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
      setClock(new Clock(timeControl));
      if (whitePlayer.type === 'computer') {
        whitePlayer.engine.newGame();
      }
      if (blackPlayer.type === 'computer') {
        blackPlayer.engine.newGame();
      }
    },
    [position, timeControl, whitePlayer, blackPlayer],
  );

  React.useEffect(() => {
    if (position.isGameOver()) {
      clock.stop();
      return;
    }
  }, [position, clock]);
  React.useEffect(() => {
    const handleFlag = (color: 'white' | 'black'): void => {
      setPosition(position.flag(color));
    };
    clock.events.on('flag', handleFlag);
    return (): void => {
      clock.events.off('flag', handleFlag);
    };
  }, [clock, position]);

  const onMove = React.useCallback(
    (move: Move) => {
      console.log('Move!', move);
      setPosition(position.move(move));
      clock.press();
    },
    [position, clock],
  );

  // Responsive layout
  //
  // +--------------------+----------------+
  // |     left pane      |   right pane   |
  // |+------------------+|+--------------+|
  // ||                  |||              ||
  // ||                  |||    board     ||
  // ||      board       |||    right     ||
  // ||                  |||              ||
  // ++------------------+|+---------------|
  // || bottom left pane ||                |
  // ++------------------+|                |
  // +--------------------+----------------+
  //
  // Board is square.  We maximize board area assuming right pane has a fixed
  // width and bottom left pane has a fixed height.
  const playRef = React.useRef<HTMLDivElement>(null);
  const playRect = useDimensions(playRef, { measureOnResize: true });
  const [boardWidth, setBoardWidth] = React.useState(0);
  const [rightPaneWidth, setRightPaneWidth] = React.useState(0);
  const [bottomLeftPaneHeight, setBottomLeftPaneHeight] = React.useState(0);

  const setBottomLeftPaneRef = React.useCallback((node: HTMLDivElement) => {
    if (node != null) {
      setBottomLeftPaneHeight(node.getBoundingClientRect().height);
    }
  }, []);
  const setRightPaneRef = React.useCallback((node: HTMLDivElement) => {
    if (node != null) {
      setRightPaneWidth(node.getBoundingClientRect().width);
    }
  }, []);
  React.useEffect((): void => {
    if (
      playRect === null ||
      rightPaneWidth === 0 ||
      bottomLeftPaneHeight === 0
    ) {
      return;
    }
    const newWidth = Math.min(
      playRect.width - rightPaneWidth,
      playRect.height - bottomLeftPaneHeight,
    );
    setBoardWidth(newWidth);
  }, [playRect, rightPaneWidth, bottomLeftPaneHeight]);

  const boardContainerStyle = {
    width: boardWidth + 'px',
    height: boardWidth + 'px',
  };
  const boardRightContainerStyle = {
    height: boardWidth + 'px',
  };

  let canMove = !position.isGameOver();
  if (position.chess.turn() === 'w') {
    if (whitePlayer.type === 'computer') {
      canMove = false;
    }
  } else {
    if (blackPlayer.type === 'computer') {
      canMove = false;
    }
  }
  return (
    <div ref={playRef} className={css.play}>
      <div className={css.leftPane}>
        <div className={css.boardContainer} style={boardContainerStyle}>
          <Board chess={position.chess} canMove={canMove} onMove={onMove} />
        </div>
        <div ref={setBottomLeftPaneRef} className={css.bottomLeftPane}>
          <div className={css.inputRow}>
            <label className={css.inputLabel} htmlFor="fen">
              FEN
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
      <div ref={setRightPaneRef} className={css.rightPane}>
        <div
          className={css.boardRightContainer}
          style={boardRightContainerStyle}
        >
          <ClockDisplay clock={clock} color={'black'} />
          <div className={css.divider} />
          <div className={css.pgn}>
            <History position={position} />
          </div>
          <div className={css.divider} />
          <ClockDisplay clock={clock} color={'white'} />
        </div>
      </div>
    </div>
  );
}
