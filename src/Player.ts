import { Engine } from './Engine';

export abstract class Player {
  abstract getName(): string;
}

export class HumanPlayer extends Player {
  readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  getName(): string {
    return this.name;
  }
}

export class ComputerPlayer extends Player {
  readonly engine: Engine;

  constructor(engine: Engine) {
    super();
    this.engine = engine;
  }

  getName(): string {
    return this.engine.name;
  }
}

const ENGINES = {
  Stockfish:
    'C:/Users/Andrew/Downloads/stockfish-11-win/Windows/stockfish_20011801_x64_modern.exe',
  Chessey: '/Users/andrewchien/code/chessey/build/chessey',
  Chessier: '/Users/andrewchien/code/chessier/target/debug/chessier',
  Komodo:
    'C:/Users/Andrew/Downloads/komodo-10_ae4bdf/Windows/komodo-10-64bit.exe',
};

export function makeComputerPlayer(name: keyof typeof ENGINES): ComputerPlayer {
  return new ComputerPlayer(new Engine(name, ENGINES[name]));
}

export function makeHumanPlayer(name: string): HumanPlayer {
  return new HumanPlayer(name);
}
