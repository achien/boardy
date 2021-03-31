import * as EventEmitter from 'events';

export interface TimeControl {
  white: number;
  black: number;
  whiteIncrement?: number;
  blackIncrement?: number;
}

export class Clock {
  events: EventEmitter;

  // All time is stored in milliseconds
  private white: number;
  private black: number;
  whiteIncrement: number;
  blackIncrement: number;
  private turn: 'white' | 'black';
  private updateTime: number | null;
  private flagTimer: NodeJS.Timeout | null = null;

  constructor(options: TimeControl, turn: 'white' | 'black') {
    this.white = options.white;
    this.black = options.black;
    this.whiteIncrement = options.whiteIncrement ?? 0;
    this.blackIncrement = options.blackIncrement ?? 0;
    this.turn = turn;
    this.updateTime = null;

    this.events = new EventEmitter();
  }

  isStopped(): boolean {
    return this.updateTime === null;
  }

  stop(): void {
    this.update();
    this.updateTime = null;
    this.events.emit('change');
    this.updateFlagTimer();
  }

  start(color?: 'white' | 'black'): void {
    this.updateTime = Date.now();
    if (color != null) {
      this.turn = color;
    }
    this.events.emit('change');
    this.updateFlagTimer();
  }

  pressAndPause(): void {
    // To unpause while pressing we switch the colors then start the clock.
    // This is used for the first move of the game when the clock starts paused.
    if (this.isStopped()) {
      this.start(this.turn === 'white' ? 'black' : 'white');
      return;
    }
    this.update();
    this.updateTime = null;
    if (this.turn === 'white') {
      this.turn = 'black';
      this.white += this.whiteIncrement;
    } else {
      this.turn = 'white';
      this.black += this.blackIncrement;
    }
    this.updateFlagTimer();
    this.events.emit('change');
  }

  getTurn(): 'white' | 'black' {
    return this.turn;
  }

  get(color: 'white' | 'black'): number {
    this.update();
    return color === 'white' ? this.white : this.black;
  }

  private update(): void {
    if (this.updateTime === null) {
      return;
    }
    const now = Date.now();
    const diff = this.updateTime - now;
    if (this.turn === 'white') {
      this.white += diff;
    } else {
      this.black += diff;
    }
    this.updateTime = now;
  }

  private updateFlagTimer(): void {
    if (this.flagTimer !== null) {
      clearTimeout(this.flagTimer);
    }
    if (this.isStopped()) {
      return;
    }
    if (this.turn === 'white') {
      this.flagTimer = setTimeout(
        () => this.events.emit('flag', 'white'),
        this.white,
      );
    } else {
      this.flagTimer = setTimeout(
        () => this.events.emit('flag', 'black'),
        this.black,
      );
    }
  }
}
