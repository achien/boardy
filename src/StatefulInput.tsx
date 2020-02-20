import * as React from 'react';

type StatefulInputProps = {
  type?: 'text' | 'textarea';
  value: string;
  onValueInput: (value: string) => void;
} & Record<string, any>;

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
    onValueInput(inputValue);
  }, [onValueInput, inputValue]);
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // "Enter" submits
      if (e.keyCode === 13) {
        onValueInput(inputValue);
      }
    },
    [onValueInput, inputValue],
  );
  const onSubmit = React.useCallback(() => onValueInput(inputValue), [
    onValueInput,
    inputValue,
  ]);

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
        onSubmit={onSubmit}
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
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
        {...otherProps}
      />
    );
  }
}
