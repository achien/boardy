import * as React from 'react';
import * as classNames from 'classnames';
import { Move } from 'chess.js';

import { Board } from './board/Board';
import { Clock, TimeControl } from './Clock';
import { ClockDisplay } from './ClockDisplay';
import { History } from './History';
import { ComputerPlayer, Player } from './Player';
import { Position } from './Position';
import { Spinner } from './Spinner';
import { StatefulInput } from './StatefulInput';
import { useDimensions } from './useDimensions';

import styles from './Play.css';

// const INITIAL_POSITION = '6k1/5ppp/8/8/8/8/8/1R4K1 w - - 0 1';
// const INITIAL_POSITION = '8/8/8/8/8/3k1r2/6K1/8 b - - 0 1';
const INITIAL_POSITION = undefined;

function usePlayer(
  player: Player,
  color: 'white' | 'black',
  position: Position,
  setPosition: React.Dispatch<React.SetStateAction<Position>>,
  clock: Clock,
  gameStarted: boolean,
): boolean {
  const [isReady, setIsReady] = React.useState(false);

  // Setup the engine
  React.useEffect(() => {
    if (!(player instanceof ComputerPlayer)) {
      setIsReady(true);
      return;
    }
    const engine = player.engine;
    (async (): Promise<void> => {
      await engine.start();
      await engine.ready();
      setIsReady(true);
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
    const chessJsColor = color === 'white' ? 'w' : 'b';
    if (
      gameStarted &&
      !position.isGameOver() &&
      position.chess.turn() === chessJsColor
    ) {
      if (player instanceof ComputerPlayer) {
        player.engine.position(position).play(clock);
      }
      clock.start();
    }
  }, [player, color, gameStarted, position, clock]);

  // Make the engine's move
  React.useEffect(() => {
    if (!(player instanceof ComputerPlayer)) {
      return;
    }
    const engine = player.engine;
    const handleBestMove = (move: string): void => {
      setPosition(position.move(move));
      clock.pressAndPause();
    };
    engine.events.on('bestmove', handleBestMove);
    return (): void => {
      engine.events.off('bestmove', handleBestMove);
    };
  }, [player, position, setPosition, clock]);

  return isReady;
}

interface Props {
  timeControl: TimeControl;
  whitePlayer: Player;
  blackPlayer: Player;
}

export function Play(props: Readonly<Props>): JSX.Element {
  const { timeControl, whitePlayer, blackPlayer } = props;
  const [gameStarted, setGameStarted] = React.useState(false);
  const [position, setPosition] = React.useState(new Position());
  const [clock, setClock] = React.useState(new Clock(timeControl, 'white'));
  const whiteIsReady = usePlayer(
    whitePlayer,
    'white',
    position,
    setPosition,
    clock,
    gameStarted,
  );
  const blackIsReady = usePlayer(
    blackPlayer,
    'black',
    position,
    setPosition,
    clock,
    gameStarted,
  );

  const newGame = React.useCallback(
    (fen?: string) => {
      if (whitePlayer instanceof ComputerPlayer) {
        whitePlayer.engine.newGame();
      }
      if (blackPlayer instanceof ComputerPlayer) {
        blackPlayer.engine.newGame();
      }
      const nextPosition = new Position(fen);
      const turn = nextPosition.chess.turn() === 'w' ? 'white' : 'black';
      const nextClock = new Clock(timeControl, turn);
      // If the first player to move is an engine, start the clock.  If it's
      // a player, leave the clock paused until it's their turn.
      if (
        (turn === 'white' && whitePlayer instanceof ComputerPlayer) ||
        (turn === 'black' && blackPlayer instanceof ComputerPlayer)
      ) {
        nextClock.start();
      }
      setPosition(nextPosition);
      setClock(nextClock);
    },
    [whitePlayer, blackPlayer, timeControl],
  );

  const loading = !whiteIsReady || !blackIsReady;
  React.useEffect(() => {
    if (!loading) {
      newGame(INITIAL_POSITION);
      setGameStarted(true);
    }
  }, [loading, newGame]);

  const onFenInput = React.useCallback(
    (fen: string) => {
      fen = fen.trim();
      const valid = position.chess.validate_fen(fen);
      if (!valid.valid) {
        console.warn(`Invalid fen (${valid.error_number}): ${valid.error}`);
        return;
      }
      // Fen changed, let's update the position
      newGame(fen);
    },
    [position, newGame],
  );

  React.useEffect(() => {
    if (position.isGameOver()) {
      clock.stop();
      console.log(position.chess.pgn());
      // newGame(INITIAL_POSITION);
      return;
    }
  }, [position, clock, newGame]);
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
      clock.pressAndPause();
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

  let loadingOverlay = null;
  if (loading) {
    loadingOverlay = (
      <div className={styles.loadingOverlay}>
        <Spinner />
      </div>
    );
  }

  let canMove = !loading && !position.isGameOver();
  if (position.chess.turn() === 'w') {
    if (whitePlayer instanceof ComputerPlayer) {
      canMove = false;
    }
  } else {
    if (blackPlayer instanceof ComputerPlayer) {
      canMove = false;
    }
  }
  return (
    <div ref={playRef} className={styles.play}>
      <div className={styles.leftPane}>
        <div className={styles.boardContainer} style={boardContainerStyle}>
          <Board chess={position.chess} canMove={canMove} onMove={onMove} />
          {loadingOverlay}
        </div>
        <div ref={setBottomLeftPaneRef} className={styles.bottomLeftPane}>
          <div className={styles.inputRow}>
            <label className={styles.inputLabel} htmlFor="fen">
              FEN
            </label>
            <StatefulInput
              value={position.chess.fen()}
              onValueInput={onFenInput}
              id="fen"
              className={classNames(styles.input, styles.fenInput)}
            />
          </div>
        </div>
      </div>
      <div ref={setRightPaneRef} className={styles.rightPane}>
        <div
          className={styles.boardRightContainer}
          style={boardRightContainerStyle}
        >
          <ClockDisplay clock={clock} color={'black'} />
          <div className={styles.divider} />
          <div className={styles.name}>{blackPlayer.getName()}</div>
          <div className={styles.divider} />
          <div className={styles.history}>
            <History position={position} />
          </div>
          <div className={styles.divider} />
          <div className={styles.name}>{whitePlayer.getName()}</div>
          <div className={styles.divider} />
          <ClockDisplay clock={clock} color={'white'} />
        </div>
      </div>
    </div>
  );
}
