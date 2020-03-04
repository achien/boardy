import * as React from 'react';

interface StatefulInputProps extends React.HTMLAttributes<HTMLElement> {
  type?: 'text' | 'textarea';
  value: string;
  // Explicit is when user hits enter
  // Implicit is when user blurs
  onValueInput: (value: string, type: 'explicit' | 'implicit') => void;
}

export function StatefulInput(props: StatefulInputProps): JSX.Element {
  const { type, value, onValueInput, ...otherProps } = props;
  const [inputValue, setInputValue] = React.useState(value);
  const [focused, setFocused] = React.useState(false);

  const onChange = React.useCallback((e: React.FormEvent) => {
    const target = e.target as HTMLInputElement;
    setInputValue(target.value);
  }, []);

  const onFocus = React.useCallback(() => setFocused(true), []);
  const onBlur = React.useCallback(() => {
    setFocused(false);
    onValueInput(inputValue, 'implicit');
  }, [onValueInput, inputValue]);
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // "Enter" submits
      if (e.keyCode === 13) {
        onValueInput(inputValue, 'explicit');
      }
    },
    [onValueInput, inputValue],
  );

  // Update input value with new value if the component is not focused
  const prevValueRef = React.useRef(value);
  React.useEffect(() => {
    if (prevValueRef.current === value) {
      return;
    }
    prevValueRef.current = value;
    if (!focused) {
      setInputValue(value);
    }
  }, [value, focused]);

  if (type == null || type === 'text') {
    return (
      <input
        value={inputValue}
        autoComplete="off"
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        {...otherProps}
      />
    );
  } else {
    return (
      <textarea
        value={inputValue}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        {...otherProps}
      />
    );
  }
}
