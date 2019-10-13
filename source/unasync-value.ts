import { anyValue } from "../interface/any";
import { CodeSnippetCallInstance } from "../interface/code-snippet";
import { noboSingleton } from "../interface/nobo-singleton";

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
