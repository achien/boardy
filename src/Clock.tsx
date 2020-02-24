import * as React from 'react';

import { TimeControl } from './TimeControl';

import css from './Clock.css';

const MSEC_IN_SEC = 1000;
const MSEC_IN_MIN = 60 * MSEC_IN_SEC;
const MSEC_IN_HOUR = 60 * MSEC_IN_MIN;

interface ClockProps {
  timeControl: TimeControl;
  color: 'white' | 'black';
}

export function Clock(props: ClockProps): JSX.Element {
  const { timeControl, color } = props;
  const [_, forceUpdate] = React.useReducer(x => x + 1, 0);
  const time = Math.max(0, timeControl.get(color));

  React.useEffect(() => {
    timeControl.events
      .on('pause', forceUpdate)
      .on('unpause', forceUpdate)
      .on('press', forceUpdate)
      .on('flag', forceUpdate);
    return (): void => {
      timeControl.events
        .off('pause', forceUpdate)
        .off('unpause', forceUpdate)
        .off('press', forceUpdate)
        .off('flag', forceUpdate);
    };
  }, [timeControl]);

  // const nextUpdate = time % 1000;
  // setTimeout(forceUpdate, nextUpdate);
  requestAnimationFrame(forceUpdate);

  const hours = Math.floor(time / MSEC_IN_HOUR);
  const minutes = Math.floor((time % MSEC_IN_HOUR) / MSEC_IN_MIN);
  const seconds = Math.floor((time % MSEC_IN_MIN) / MSEC_IN_SEC);
  const milliseconds = time % MSEC_IN_SEC;

  let hourDisplay = null;
  if (time >= MSEC_IN_HOUR) {
    const hourText = hours >= 10 ? hours.toString() : '0' + hours;
    hourDisplay = <>{hourText}:</>;
  }

  const minuteText = minutes >= 10 ? minutes.toString() : '0' + minutes;
  const minuteDisplay = <>{minuteText}:</>;

  const secondText = seconds >= 10 ? seconds.toString() : '0' + seconds;
  const secondDisplay = <>{secondText}</>;

  let hundredthsDisplay = null;
  if (time <= MSEC_IN_MIN) {
    const hundredths = Math.round(milliseconds / 10);
    const hundredthsText =
      hundredths >= 10 ? hundredths.toString() : '0' + hundredths;
    hundredthsDisplay = <>.{hundredthsText}</>;
  }

  let flag = null;
  if (time === 0) {
    flag = String.fromCodePoint(0x1f6a9);
  }

  return (
    <div className={css.clock}>
      {hourDisplay}
      {minuteDisplay}
      {secondDisplay}
      {hundredthsDisplay}
      {flag}
    </div>
  );
}
