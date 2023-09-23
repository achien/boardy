import * as React from 'react';
import * as classNames from 'classnames';

import { Clock } from './Clock';

import styles from './ClockDisplay.css';

const MSEC_IN_SEC = 1000;
const MSEC_IN_MIN = 60 * MSEC_IN_SEC;
const MSEC_IN_HOUR = 60 * MSEC_IN_MIN;

interface ClockDisplayProps {
  clock: Clock;
  color: 'white' | 'black';
}

export function ClockDisplay(props: ClockDisplayProps): JSX.Element {
  const { clock, color } = props;
  const [_, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const time = Math.max(0, clock.get(color));

  React.useEffect(() => {
    clock.events.on('change', forceUpdate).on('flag', forceUpdate);
    return (): void => {
      clock.events.off('change', forceUpdate).off('flag', forceUpdate);
    };
  }, [clock]);

  React.useEffect(() => {
    let requestID: number;
    const update = (): void => {
      forceUpdate();
      requestID = requestAnimationFrame(update);
    };
    requestID = requestAnimationFrame(update);
    return (): void => {
      cancelAnimationFrame(requestID);
    };
  }, []);

  const hours = Math.floor(time / MSEC_IN_HOUR);
  const minutes = Math.floor((time % MSEC_IN_HOUR) / MSEC_IN_MIN);
  const seconds = Math.floor((time % MSEC_IN_MIN) / MSEC_IN_SEC);
  const milliseconds = time % MSEC_IN_SEC;

  let hourDisplay = null;
  if (time >= MSEC_IN_HOUR) {
    hourDisplay = <>{hours}:</>;
  }

  let minuteDisplay;
  if (time >= MSEC_IN_HOUR || minutes >= 10) {
    const minuteText = minutes >= 10 ? minutes.toString() : '0' + minutes;
    minuteDisplay = <>{minuteText}:</>;
  } else {
    minuteDisplay = (
      <>
        <span className={styles.leadingZero}>0</span>
        {minutes}:
      </>
    );
  }

  const secondText = seconds >= 10 ? seconds.toString() : '0' + seconds;
  const secondDisplay = <>{secondText}</>;

  let subsecondDisplay = null;
  if (time < 10 * MSEC_IN_SEC) {
    const hundredths = Math.floor(milliseconds / 10);
    const hundredthsText =
      hundredths >= 10 ? hundredths.toString() : '0' + hundredths;
    subsecondDisplay = <>.{hundredthsText}</>;
  } else if (time < MSEC_IN_MIN) {
    const tenths = Math.floor(milliseconds / 100);
    subsecondDisplay = <>.{tenths}</>;
  }

  const clockClassNames = classNames({
    [styles.clock]: true,
    [styles.timeOut]: time === 0,
  });

  return (
    <div className={clockClassNames}>
      {hourDisplay}
      {minuteDisplay}
      {secondDisplay}
      {subsecondDisplay}
    </div>
  );
}
