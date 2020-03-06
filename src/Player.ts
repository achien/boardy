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
    '/Users/andrewchien/Downloads/stockfish-11-mac/Mac/stockfish-11-modern',
  Chessey: '/Users/andrewchien/code/chessey/build/chessey',
  Chessier: '/Users/andrewchien/code/chessier/target/debug/chessier',
  Komodo: '/Users/andrewchien/Downloads/komodo-10_ae4bdf/OSX/komodo-10-64-osx',
};

export function makeComputerPlayer(name: keyof typeof ENGINES): ComputerPlayer {
  return new ComputerPlayer(new Engine(name, ENGINES[name]));
}

export function makeHumanPlayer(name: string): HumanPlayer {
  return new HumanPlayer(name);
}
