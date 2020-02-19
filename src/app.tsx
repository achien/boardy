import * as React from 'react';
import * as ReactDOM from 'react-dom';

const Chess = require('chess.js');

import { Board } from './board/board';

const root = document.createElement('div');
document.body.appendChild(root);
let chess = new Chess();
ReactDOM.render(<Board width={600} chess={chess} />, root);
