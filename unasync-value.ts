import { anyValue } from "./any";
import { CodeSnippetCallInstance } from "./interfaces";
import isPromise from "./is-promise";

export default function(
  callInstance: CodeSnippetCallInstance,
  defaultValueForKeyPath: (keyPath: string) => anyValue,
  keyPath: string,
  value: anyValue,
  then: (value: anyValue) => void
): anyValue {
  if (!isPromise(value)) return value;
  const promise = <Promise<anyValue>>value;
  callInstance.retryAfterPromise(promise.then(then), keyPath);
  return defaultValueForKeyPath(keyPath);
}
