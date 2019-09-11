import { anyValue } from "./any";
export interface CodeSnippetCallInstance {
  retryAfterPromise(promise: Promise<void>, name: string): void;
  registerSideEffect(perform: CodeSnippetSideEffect, name?: string): void;
}

export interface CodeSnippetArg {
  value: anyValue;
  valueGetter?: (callInstance: CodeSnippetCallInstance) => anyValue;
  defaultValueForKeyPath: (keyPath: string) => anyValue;
}

export type CodeSnippetSideEffect = { run: () => Promise<void> | undefined; name?: string };
export type CodeSnippetCallSuccess = { result?: anyValue; sideEffects: CodeSnippetSideEffect[] };
export type CodeSnippetCallRetry = { retryingAfterPromises?: string[] };
export type CodeSnippetCallResult = CodeSnippetCallSuccess | CodeSnippetCallRetry;
