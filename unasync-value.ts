import { anyValue } from "./interfaces/any";
import { CodeSnippetCallInstance } from "./interfaces/code-snippet";
import { noboSingleton } from "./interfaces/nobo-singleton";

export default function<T>(
  callInstance: CodeSnippetCallInstance,
  defaultValueForKeyPath: (keyPath: string) => T,
  keyPath: string,
  value: T | Promise<T>,
  then: (value: T) => void
): T {
  if (!noboSingleton.isPromise(<anyValue>value)) return <T>value;
  const promise = <Promise<T>>value;
  callInstance.retryAfterPromise(promise.then(then), keyPath);
  return defaultValueForKeyPath(keyPath);
}
