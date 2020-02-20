import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Chess, { ChessInstance, Move, ShortMove } from 'chess.js';

import { Board } from './board/board';

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

function App(): JSX.Element {
  const chess = new Chess();
  console.log(chess.moves());
  console.log(chess.moves({ verbose: true }));
  console.log('e2', chess.moves({ verbose: true, square: 'e2' }));
  console.log('e3', chess.moves({ verbose: true, square: 'e3' }));
  console.log('g1', chess.moves({ verbose: true, square: 'g1' }));
  chess.move('Nf3');
  chess.move('Nf6');
  chess.move('e3');
  chess.move('e6');
  chess.move('Be2');
  chess.move('Be7');
  console.log(chess.moves());
  console.log(chess.moves({ verbose: true }));
  chess.move('O-O');
  console.log(chess.pgn());

  console.log('------chess2');
  const chess2 = new Chess(
    '4r3/8/2p2PPk/1p6/pP2p1R1/P1B5/2P2K2/3r4 w - - 1 45',
  );
  console.log(chess2.history());
  console.log(chess2.moves());
  chess2.move('f7');
  console.log('after f7', chess2.history());
  chess2.reset();
  console.log(chess2.fen());

  const [game, setGame] = React.useState(new Game());

  const onMove = React.useCallback(
    (move: Move) => {
      setGame(game.move(move));
    },
    [game],
  );

  return <Board width={600} chess={game.chess} onMove={onMove} />;
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<App />, root);
