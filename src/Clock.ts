import * as EventEmitter from 'events';

interface TimeOptions {
  white: number;
  black: number;
  whiteIncrement?: number;
  blackIncrement?: number;
  turn?: 'black' | 'white';
}

export class Clock {
  events: EventEmitter;

  // All time is stored in milliseconds
  private white: number;
  private black: number;
  whiteIncrement: number;
  blackIncrement: number;
  private turn: 'black' | 'white';
  private updateTime: number | null;
  private flagTimer: NodeJS.Timeout | null = null;

  constructor(options: TimeOptions) {
    this.white = options.white;
    this.black = options.black;
    this.whiteIncrement = options.whiteIncrement || 0;
    this.blackIncrement = options.blackIncrement || 0;
    this.turn = options.turn || 'black';
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

  start(): void {
    this.updateTime = Date.now();
    this.events.emit('change');
    this.updateFlagTimer();
  }

  press(): void {
    if (this.isStopped()) {
      this.start();
      return;
    }
    this.update();
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

  getTurn(): 'black' | 'white' {
    return this.turn;
  }

  get(color: 'black' | 'white'): number {
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
