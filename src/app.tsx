import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Chess, { ChessInstance, Move, ShortMove } from 'chess.js';

import { Board } from './board/board';

import css from './app.css';

document.addEventListener('dragover', (e: DragEvent) => {
  // Prevent default so dropping is possible.
  // This also removes the animation snapping the piece back to the original
  // square so things are less janky!
  e.preventDefault();
});

class Game {
  initialFen: string | null;
  chess: ChessInstance;

  constructor(initialFen?: string | null) {
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

interface FenInputProps {
  fen: string;
  // Return true if successful change, false if unsuccessful
  onFenInput: (fen: string) => void;
}

function FenInput(props: FenInputProps): JSX.Element {
  const [value, setValue] = React.useState(props.fen);
  const [focused, setFocused] = React.useState(false);

  const onChange = React.useCallback((e: React.FormEvent) => {
    const target = e.target as HTMLInputElement;
    setValue(target.value);
  }, []);

  const onFenInput = React.useCallback(() => {
    const cb = props.onFenInput;
    cb(value);
  }, [props.onFenInput, value]);
  const onFocus = React.useCallback(() => setFocused(true), []);
  const onBlur = React.useCallback(() => {
    setFocused(false);
    onFenInput();
  }, [onFenInput]);
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // "Enter" submits
      if (e.keyCode === 13) {
        onFenInput();
      }
    },
    [onFenInput],
  );

  // Update FEN if the component is not focused
  const prevFenRef = React.useRef(props.fen);
  React.useEffect(() => {
    if (prevFenRef.current === props.fen) {
      return;
    }
    prevFenRef.current = props.fen;
    if (!focused) {
      setValue(props.fen);
    }
  }, [props.fen, focused]);

  return (
    <div className={css.fenInputWrapper}>
      <label className={css.fenInputLabel} htmlFor={'fen'}>
        FEN:
      </label>
      <input
        id="fen"
        className={css.fenInput}
        value={value}
        autoComplete="off"
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmit={onFenInput}
        onKeyDown={onKeyDown}
      />
    </div>
  );
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
      const valid = game.chess.validate_fen(fen);
      if (!valid.valid) {
        console.warn(`Invalid fen (${valid.error_number}): ${valid.error}`);
        return;
      }
      if (fen === game.chess.fen()) {
        // Don't refresh the game if user clicks in and out of the input
        return;
      }
      // Fen changed, let's update the game
      setGame(new Game(fen));
    },
    [game],
  );

  return (
    <div className={css.app}>
      <Board width={600} chess={game.chess} onMove={onMove} />
      <FenInput fen={game.chess.fen()} onFenInput={onFenInput} />
    </div>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<App />, root);
