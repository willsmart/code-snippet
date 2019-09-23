import permissableGlobals from './permissable-globals';
import {
  CodeSnippetArg,
  CodeSnippetCallInstance,
  CodeSnippetCallResult,
  CodeSnippetSideEffect,
  CodeSnippetCallSuccess,
} from './interfaces/code-snippet';
import { CodeSnippetObjectProxyManager } from './code-snippet-object-proxy-manager';
import unasyncValue from './unasync-value';
import { anyObject, anyValue } from './interfaces/any';
import { CodeSnippet } from './code-snippet';
import { SourceName } from './interfaces/sinks-and-sources';
import { HandlePromise } from './interfaces/promise-handler';
import { noboSingleton } from './interfaces/nobo-singleton';

export class CodeSnippetCaller<T> {
  codeSnippet: CodeSnippet<T>;
  localArgs: { [key: string]: CodeSnippetArg };
  handlePromise: HandlePromise;

  constructor({
    codeSnippet,
    localArgs = {},
    handlePromise,
  }: {
    codeSnippet: CodeSnippet<T>;
    localArgs: { [key: string]: CodeSnippetArg };
    handlePromise?: HandlePromise;
  }) {
    this.codeSnippet = codeSnippet;
    this.localArgs = localArgs;
    this.handlePromise = handlePromise || noboSingleton.handlePromise;
  }

  call(localOverrides: anyObject = {}): CodeSnippetCallResult<T> {
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
    const { localArgs, codeSnippet, handlePromise } = this;

    for (const key of Object.keys(localArgs)) {
      let { value: localValue, valueGetter, defaultValueForKeyPath } = localArgs[key];
      if (valueGetter) localValue = valueGetter(callInstance);

      localValue = locals[key] = unasyncValue(
        callInstance,
        defaultValueForKeyPath,
        key,
        key in localOverrides ? localOverrides[key] : localValue,
        value => {
          localOverrides[key] = value;
        }
      );
      if (!localValue || typeof localValue !== 'object') continue;

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
    const result = codeSnippet.func(codeSnippet.maskGlobals.map(key => key in locals && locals[key]));

    if (!needsRetry) {
      return { promise: Promise.resolve({ result, sideEffects }) };
    }

    return {
      retryingAfterPromises: Object.keys(retryAfterPromises),
      promise: new Promise(async resolve => {
        let result: CodeSnippetCallSuccess<T>;
        await handlePromise(
          Promise.all(Object.values(retryAfterPromises)).then(async () => {
            result = await this.call(localArgs);
            return undefined;
          })
        );
        resolve(result);
      }),
    };
  }

  async commit({ sideEffects }: { sideEffects: CodeSnippetSideEffect[] }): Promise<void> {
    await this.handlePromise(Promise.all(sideEffects.map(sideEffect => sideEffect.run())));
  }
}
