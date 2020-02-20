declare module '*.css' {
  const classNames: Record<string, string>;
  export default classNames;
}

declare module '*.svg' {
  const file: string;
  export default file;
}
