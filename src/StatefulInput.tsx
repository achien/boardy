import * as React from 'react';

interface StatefulInputProps extends React.HTMLAttributes<HTMLElement> {
  type?: 'text' | 'textarea';
  value: string;
  // Explicit is when user hits enter
  // Implicit is when user blurs
  onValueInput: (value: string) => void;
}

export function StatefulInput(props: StatefulInputProps): JSX.Element {
  const { type, value, onValueInput, ...otherProps } = props;
  const [inputValue, setInputValue] = React.useState(value);
  const [focused, setFocused] = React.useState(false);
  const [valueOnFocusOrEnter, setValueOnFocusOrEnter] = React.useState<
    string
  >();

  const onChange = React.useCallback((e: React.FormEvent) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setInputValue(target.value);
  }, []);

  const onFocus = React.useCallback(() => {
    setValueOnFocusOrEnter(inputValue);
    setFocused(true);
  }, [inputValue]);
  const onBlur = React.useCallback(() => {
    setFocused(false);
    // If the user clicks into the input and makes no changes, don't fire
    // the callback on blur
    if (inputValue !== valueOnFocusOrEnter) {
      onValueInput(inputValue);
    }
  }, [onValueInput, inputValue, valueOnFocusOrEnter]);
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // "Enter" submits always, even if no changes were made
      if (e.keyCode === 13) {
        setValueOnFocusOrEnter(inputValue);
        onValueInput(inputValue);
      }
    },
    [onValueInput, inputValue],
  );

  // Update input value with new value if the component is not focused,
  // or when the component loses focus
  React.useEffect(() => {
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
