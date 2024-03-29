import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as assert from 'assert';
import * as EventEmitter from 'events';
import memoize from './memoize';
import { Position } from './Position';
import { Clock } from './Clock';

enum State {
  Loading,
  UCI,
  Ready,
}

type OptionType = 'check' | 'spin' | 'combo' | 'button' | 'string';

interface CheckOption {
  name: string;
  type: 'check';
  default: boolean;
}

interface SpinOption {
  name: string;
  type: 'spin';
  default: number;
  min: number;
  max: number;
}

interface ComboOption {
  name: string;
  type: 'combo';
  default: string;
  vars: string[];
}

interface ButtonOption {
  name: string;
  type: 'button';
}

interface StringOption {
  name: string;
  type: 'string';
  default: string;
}

type Option =
  | CheckOption
  | SpinOption
  | ComboOption
  | ButtonOption
  | StringOption;

// Standard options for UCI
const StandardOptionTypes: Record<string, OptionType> = {
  /* eslint-disable @typescript-eslint/camelcase */
  Hash: 'spin',
  NalimovPath: 'string',
  NalimovCache: 'spin',
  Ponder: 'check',
  OwnBook: 'check',
  MultiPV: 'spin',
  UCI_ShowCurrLine: 'check',
  UCI_ShowRefutations: 'check',
  UCI_LimitStrength: 'check',
  UCI_Elo: 'spin',
  UCI_AnalyseMode: 'check',
  UCI_Opponent: 'string',
  UCI_EngineAbout: 'string',
  UCI_ShredderbasesPath: 'string',
  UCI_SetPositionValue: 'string',
  /* eslint-enable */
};

type optionValue = boolean | number | string | null;

export class Engine {
  readonly name: string;
  readonly path: string;
  readonly options: Record<string, optionValue>;
  readonly events: EventEmitter;

  // Engine-provided info
  fullName: string | null = null;
  author: string | null = null;
  availableOptions: Record<string, Option>;

  // class internals
  private state: State;
  private stateEmitter: EventEmitter;
  private process: ChildProcess | null = null;
  private readline: readline.Interface | null = null;

  constructor(
    name: string,
    path: string,
    options?: Record<string, optionValue>,
  ) {
    this.name = name;
    this.path = path;
    this.options = options ?? {};
    this.events = new EventEmitter();

    this.availableOptions = {};

    this.state = State.Loading;
    this.stateEmitter = new EventEmitter();
  }

  // Naively waits for a state to happen.  Doesn't check if we're already in
  // the state, or if the state is no longer reachable, or anything else.
  async waitForState(state: State): Promise<void> {
    return new Promise((resolve, _reject) => {
      const listener = (newState: State): void => {
        if (state === newState) {
          this.stateEmitter.removeListener('change', listener);
          resolve();
        }
      };
      this.stateEmitter.on('change', listener);
    });
  }

  setOptions(options: Record<string, optionValue>): this {
    Object.assign(this.options, options);
    return this;
  }

  // Starts the engine process then sends 'uci' and waits for 'uciok'.  At
  // this point we know the engine identity and all options.
  start = memoize(async () => {
    this.process = spawn(this.path, [], {});
    this.process.on('error', (e) =>
      console.error(this.name, 'process error', e),
    );
    this.process.on('close', (...args) =>
      console.error(this.name, 'process close', args),
    );
    const stdout = this.process.stdout!;
    // stdout.setEncoding('utf8');
    // stdout.on('data', x => console.warn(this.name, 'data', x));
    // stdout.on('readable', () => {
    //   console.warn(this.name, 'readable');
    //   stdout.read();
    // });
    this.readline = readline.createInterface(stdout);
    this.readline.on('line', (line) => this.receive(line));
    this.readline.on('pause', () => {
      console.warn(`<${this.name}> input paused`);
    });

    readline
      .createInterface(this.process.stderr!)
      .on('line', (line) => console.error(`<${this.name}> ` + line));

    this.send('uci');
    await this.waitForState(State.UCI);
  });

  // Sends options, then sends 'isready' and waits for 'readyok'.
  // After this point the engine is ready to be used.
  ready = memoize(async () => {
    // We should probably validate option values against availableOptions
    for (const name in this.options) {
      const config = this.availableOptions[name];
      const value = this.options[name];
      let error = null;
      if (!config) {
        error = 'option not found';
      } else if (value === null) {
        if (config.type !== 'button') {
          error = `option type ${config.type} does not support null value`;
        }
        this.send(`setoption name ${name}`);
      } else if (typeof value === 'number') {
        if (config.type !== 'spin') {
          error = `option type ${config.type} does not support number value`;
        } else if (value < config.min || value > config.max) {
          error = `value is out of range [${config.min}, ${config.max}]`;
        }
        this.send(`setoption name ${name} value ${value}`);
      } else if (typeof value === 'boolean') {
        if (config.type !== 'check') {
          error = `option type ${config.type} does not support boolean value`;
        }
        if (value) {
          this.send(`setoption name ${name} value true`);
        } else {
          this.send(`setoption name ${name} value false`);
        }
      } else {
        if (config.type !== 'combo' && config.type !== 'spin') {
          error = `option type ${config.type} does not support string value`;
        } else if (
          config.type === 'combo' &&
          config.vars.indexOf(value) === -1
        ) {
          error = `expect value to be one of [${config.vars.join(', ')}]`;
        }
        this.send(`setoption name ${name} value ${value}`);
      }
      if (error != null) {
        console.error(
          `<${this.name}> error for option ${name}, value ${value}: ${error}`,
        );
      }
    }
    this.send('isready');
    await this.waitForState(State.Ready);
  });

  newGame(): this {
    this.send('ucinewgame');
    return this;
  }

  position(position: Position): this {
    let command = 'position';
    if (position.initialFen !== null) {
      command += ` fen ${position.initialFen}`;
    } else {
      command += ' startpos';
    }
    const moves = position.chess.history({ verbose: true }).map(
      // Convert into long algebraic notation for UCI
      (move) => move.from + move.to + (move.promotion || ''),
    );
    if (moves.length > 0) {
      command += ` moves ${moves.join(' ')}`;
    }
    this.send(command);
    return this;
  }

  // Plays the current position
  play(clock: Clock): this {
    let command = `go wtime ${clock.get('white')} btime ${clock.get('black')}`;
    if (clock.whiteIncrement > 0) {
      command += ` winc ${clock.whiteIncrement}`;
    }
    if (clock.blackIncrement > 0) {
      command += ` binc ${clock.blackIncrement}`;
    }
    this.send(command);
    return this;
  }

  quit(): this {
    this.send('quit');
    return this;
  }

  private setState(state: State): void {
    if (state !== this.state) {
      this.state = state;
      this.stateEmitter.emit('change', state);
    }
  }

  private receive(msg: string): void {
    console.log(`<${this.name}> ${msg}`);

    const handlers: Record<string, ((tokens: string[]) => void) | null> = {
      id: (tokens) => {
        switch (tokens[0]) {
          case 'name':
            this.fullName = tokens.join(' ');
            break;
          case 'author':
            this.author = tokens.join(' ');
            break;
          default:
            assert.fail(`Invalid id command without name or author: ${msg}`);
        }
      },
      uciok: () => this.setState(State.UCI),
      readyok: () => this.setState(State.Ready),
      option: (tokens) => this.handleOption(tokens),
      info: null,
      bestmove: (tokens) => this.events.emit('bestmove', tokens[0]),
    };

    const tokens = msg.split(/\s+/);
    if (tokens.length === 0) {
      return;
    }
    for (const command in handlers) {
      if (tokens[0] === command) {
        const handler = handlers[command];
        if (handler !== null) {
          handler(tokens.slice(1));
        }
        return;
      }
    }

    // Anything sent before '' does not need to be in the uci protocol
    if (this.state !== State.Loading) {
      console.error(`<${this.name}> Could not handle messsage: ${msg}`);
    }
  }

  private handleOption(tokens: string[]): void {
    try {
      const option = this.parseOption(tokens);
      if (option.name in this.availableOptions) {
        console.error(
          `<${this.name}> Duplicate option ${option.name}: ${tokens.join(' ')}`,
        );
        return;
      }
      if (option.name in StandardOptionTypes) {
        const expectedType = StandardOptionTypes[option.name];
        if (option.type !== expectedType) {
          console.error(
            `<${this.name}> option ${name} expected type ${expectedType}` +
              `actual type ${option.type}`,
          );
        }
      }
      this.availableOptions[option.name] = option;
    } catch (error) {
      console.error(
        `<${this.name}> Invalid option (${error}): ${tokens.join(' ')}`,
      );
    }
  }

  private parseOption(tokens: string[]): Option {
    if (tokens[0] !== 'name') {
      throw 'option needs name field';
    }
    const typeIdx = tokens.indexOf('type');
    if (typeIdx === -1) {
      throw 'option needs type field';
    }
    const name = tokens.slice(1, typeIdx).join(' ');
    const type = tokens[typeIdx + 1];
    tokens = tokens.slice(typeIdx + 2);

    switch (type) {
      case 'check': {
        if (tokens[0] !== 'default') {
          throw 'check option needs default';
        }
        const default_ = tokens[1];
        if (default_ !== 'true' && default_ !== 'false') {
          throw `check option default is not "true" or "false": ${default_}`;
        }
        return {
          name: name,
          type: 'check',
          default: default_ === 'true',
        };
      }
      case 'spin': {
        if (
          tokens[0] !== 'default' ||
          tokens[2] !== 'min' ||
          tokens[4] !== 'max'
        ) {
          throw 'spin option needs default, min, and max';
        }
        const default_ = parseInt(tokens[1], 10);
        const min = parseInt(tokens[3], 10);
        const max = parseInt(tokens[5], 10);
        return {
          name: name,
          type: 'spin',
          default: default_,
          min: min,
          max: max,
        };
      }
      case 'combo': {
        if (tokens[0] !== 'default') {
          throw 'combo option needs default';
        }
        let varIdx = tokens.indexOf('var');
        if (varIdx === -1) {
          throw 'combo option needs var';
        }
        const default_ = tokens.slice(1, varIdx).join(' ');
        tokens = tokens.slice(varIdx + 1);
        const vars = [];
        while (true) {
          varIdx = tokens.indexOf('var');
          if (varIdx === -1) {
            vars.push(tokens.join(' '));
            break;
          }
          vars.push(tokens.slice(0, varIdx).join(' '));
          tokens = tokens.slice(varIdx + 1);
        }
        return {
          name: name,
          type: 'combo',
          default: default_,
          vars: vars,
        };
      }
      case 'button':
        return {
          name: name,
          type: 'button',
        };
      case 'string': {
        if (tokens[0] !== 'default') {
          throw 'string option needs default';
        }
        const default_ = tokens.slice(1).join(' ');
        return {
          name: name,
          type: 'string',
          default: default_ === '<empty>' ? '' : default_,
        };
      }
      default:
        throw `Unknown option type: ${type}`;
    }
  }

  send(msg: string): void {
    console.log(`<Boardy> ${msg}`);
    this.process!.stdin!.write(msg + '\n');
  }
}
