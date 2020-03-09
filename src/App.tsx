import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Play } from './Play';
import { makeComputerPlayer, makeHumanPlayer } from './Player';

import styles from './App.css';

import 'typeface-roboto';

document.addEventListener('dragover', (e: DragEvent) => {
  // Prevent default so dropping is possible.
  // This also removes the animation snapping the piece back to the original
  // square so things are less janky!
  e.preventDefault();
});

function App(): JSX.Element {
  const [whitePlayer, _setWhitePlayer] = React.useState(
    // makeHumanPlayer('Andrew'),
    // makeComputerPlayer('Chessier'),
    makeComputerPlayer('Komodo'),
    // () => {
    //   const player = makeComputerPlayer('Stockfish');
    //   player.engine.setOptions({
    //     'Skill Level': 15,
    //   });
    //   return player;
    // },
  );
  const [blackPlayer, _setBlackPlayer] = React.useState(
    // makeComputerPlayer('Chessier'),
    makeComputerPlayer('Stockfish'),
    // makeHumanPlayer('Andrew'),
  );
  const [timeControl, _setTimeControl] = React.useState({
    white: 60 * 1000,
    black: 60 * 1000,
    whiteIncrement: 2000,
    blackIncrement: 2000,
  });

  return (
    <Play
      timeControl={timeControl}
      whitePlayer={whitePlayer}
      blackPlayer={blackPlayer}
    />
  );
}

(async function(): Promise<void> {
  const root = document.createElement('div');
  root.className = styles.reactRoot;
  document.body.appendChild(root);
  ReactDOM.render(<App />, root);
})();
