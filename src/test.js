const { spawn } = require('child_process');
const process = require('process');

const path =
  'C:/Users/Andrew/Downloads/stockfish-11-win/Windows/stockfish_20011801_x64_modern.exe';
const stockfish = spawn(path);
stockfish.stdout.setEncoding('utf8');
stockfish.stdout.on('data', x => {
  console.log('data:', x);
  if (x.indexOf('bestmove') >= 0) {
    stockfish.stdin.write('quit\n');
  }
});
stockfish.on('close', () => {
  console.log('closed');
  process.exit();
});
stockfish.stdin.write('uci\n');
stockfish.stdin.write('isready\n');
stockfish.stdin.write('ucinewgame\n');
stockfish.stdin.write('position startpos\n');
stockfish.stdin.write('go wtime 10000 btime 10000\n');
