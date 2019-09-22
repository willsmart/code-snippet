import permissableGlobals from "./permissable-globals";
import {
  CodeSnippetArg,
  CodeSnippetCallInstance,
  CodeSnippetCallResult,
  CodeSnippetSideEffect,
} from "./interfaces/code-snippet";
import { CodeSnippetObjectProxyManager } from "./code-snippet-object-proxy-manager";
import unasyncValue from "./unasync-value";
import { anyObject, anyValue } from "./interfaces/any";
import { CodeSnippet } from "./code-snippet";
import { SourceName } from "./interfaces/sinks-and-sources";

export class CodeSnippetValueSource {
  codeSnippet: CodeSnippet;
  localArgs: { [key: string]: SourceName<anyValue> };

  constructor(codeSnippet: CodeSnippet, localArgs: { [key: string]: SourceName<anyValue> } = {}) {
    this.codeSnippet = codeSnippet;
    this.localArgs = localArgs;
  }

  call(localArgs: { [key: string]: CodeSnippetArg } = {}, localValues: anyObject = {}): CodeSnippetCallResult {
    let needsRetry;
    const retryAfterPromises: { [name: string]: Promise<void> } = {},
      sideEffectIndexesByName: { [name: string]: number } = {},
      sideEffects: CodeSnippetSideEffect[] = [],
      callInstance: CodeSnippetCallInstance = {
        retryAfterPromise(promise, name) {
          retryAfterPromises[name] = promise;
          needsRetry = true;
        },
        registerSideEffect(sideEffect) {
          if (name) {
            if (name in sideEffectIndexesByName) return;
            sideEffectIndexesByName[name] = sideEffects.length;
          }
          sideEffects.push(sideEffect);
        },
      };
    const localProxyMgrs: { [key: string]: CodeSnippetObjectProxyManager } = {};
    const locals: anyObject = {};

    for (const key of Object.keys(localArgs)) {
      let { value: localValue, valueGetter, defaultValueForKeyPath } = localArgs[key];
      if (valueGetter) localValue = valueGetter(callInstance);

      localValue = locals[key] = unasyncValue(
        callInstance,
        defaultValueForKeyPath,
        key,
        key in localValues ? localValues[key] : localValue,
        value => {
          localValues[key] = value;
        }
      );
      if (!localValue || typeof localValue !== "object") continue;

      let haveRegisteredSideEffect = false;

      locals[key] = (localProxyMgrs[key] = new CodeSnippetObjectProxyManager(
        `${key}`,
        <anyObject>localValue,
        unasyncValue.bind(this, callInstance, defaultValueForKeyPath),
        () => {
          if (haveRegisteredSideEffect) return;
          haveRegisteredSideEffect = true;
          callInstance.registerSideEffect({
            run: () => {
              localProxyMgrs[key].commit();
              return undefined;
            },
            name: `commit local '${key}'`,
          });
        },
        callInstance
      )).proxy;
    }
    const result = this.func(this.maskGlobals.map(key => key in locals && locals[key]));

    if (!needsRetry) {
      return { result, sideEffects };
    }

    this.handlePromise(Promise.all(Object.values(retryAfterPromises)).then(() => this.call(localArgs)));
    return { retryingAfterPromises: Object.keys(retryAfterPromises) };
  }

  async commit({ sideEffects }: { sideEffects: CodeSnippetSideEffect[] }): Promise<void> {
    await this.handlePromise(Promise.all(sideEffects.map(sideEffect => sideEffect.run())));
  }

  static potentialGlobalsFromCodeString(codeString: string) {
    const words = new Set<string>(),
      regex = /(?<!\.)\b\w+\b/g; // TODO, this regex is pretty damn basic. It could be made much more refined
    for (let match: RegExpExecArray | null; (match = regex.exec(codeString)); ) {
      const [word] = match;
      if (!permissableGlobals.has(word)) words.add(word);
    }
    return words;
  }
}
