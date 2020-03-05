import * as React from 'react';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Options {
  // Whether to update dimensions on window resize
  measureOnResize?: boolean;
}

export function useDimensions(
  ref: React.RefObject<HTMLElement>,
  options?: Options,
): Rect | null {
  const [rect, setRect] = React.useState<Rect | null>(null);

  const setDimensions = React.useCallback((): void => {
    if (ref.current === null) {
      setRect(null);
    } else {
      // Do a shallow compare on the rect to avoid unnecessary state change
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      if (
        rect === null ||
        left !== rect.left ||
        top !== rect.top ||
        width !== rect.width ||
        height !== rect.height
      ) {
        setRect({ left, top, width, height });
      }
    }
  }, [ref, rect]);

  // Update dimensions whenver the component is updated
  React.useEffect(() => setDimensions());

  // Optionally update the dimensions when the window is resized
  const measureOnResize = (options && options.measureOnResize) ?? false;
  React.useEffect(() => {
    if (measureOnResize) {
      window.addEventListener('resize', setDimensions);
      return (): void => {
        window.removeEventListener('resize', setDimensions);
      };
    }
  }, [measureOnResize, setDimensions]);

  return rect;
}
