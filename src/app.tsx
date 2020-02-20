import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Chess from 'chess.js';

import { Board } from './board/board';

const root = document.createElement('div');
document.body.appendChild(root);
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
ReactDOM.render(<Board width={600} chess={chess} />, root);

document.addEventListener('dragover', (e: DragEvent) => {
  // Prevent default so dropping is possible.
  // This also removes the animation snapping the piece back to the original
  // square so things are less janky!
  e.preventDefault();
});
