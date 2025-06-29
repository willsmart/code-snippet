import {
  CodeSnippetArg,
  CodeSnippetCallInstance,
  CodeSnippetCallResult,
  CodeSnippetSideEffect,
  CodeSnippetCallSuccess,
} from "../interface/code-snippet";
import { CodeSnippetObjectProxyManager } from "./code-snippet-object-proxy-manager";
import unasyncValue from "./unasync-value";
import { anyObject, anyValue, anyObject_T } from "../interface/any";
import { CodeSnippet } from "./code-snippet";
import { HandlePromise } from "../interface/promise-handler";
import { noboSingleton } from "../interface/nobo-singleton";

export class CodeSnippetCaller<T extends anyValue> {
  codeSnippet: CodeSnippet<T>;
  localArgs: { [key: string]: CodeSnippetArg };
  handlePromise: HandlePromise;

  /// Tests:
  ///   retains the arguments it was constructed with
  ///   uses the singleton's handlePromise by default
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
        registerSideEffect(sideEffect, name) {
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
      let {
        value: localValue,
        valueGetter,
        defaultValueForKeyPath,
      } = localArgs[key];
      if (valueGetter) localValue = valueGetter(callInstance);

      const v: anyValue = unasyncValue(
        callInstance,
        defaultValueForKeyPath,
        key,
        key in localOverrides ? localOverrides[key] : localValue,
        (value) => {
          localOverrides[key] = value;
        }
      );
      locals[key] = localValue = v;
      if (!localValue || typeof localValue !== "object") continue;

      let haveRegisteredSideEffect = false;

      locals[key] = (localProxyMgrs[key] = new CodeSnippetObjectProxyManager(
        `${key}`,
        <anyObject>localValue,
        <
          (
            keyPath: string,
            value: anyValue | Promise<anyValue>,
            then: (value: anyValue) => void
          ) => anyValue
        >unasyncValue.bind(this, callInstance, defaultValueForKeyPath),
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
    const result = codeSnippet.func(
      codeSnippet.maskGlobals.map((key) => key in locals && locals[key])
    );

    if (!needsRetry) {
      return { promise: Promise.resolve({ result, sideEffects }) };
    }

    return {
      retryingAfterPromises: Object.keys(retryAfterPromises),
      promise: new Promise(async (resolve, reject) => {
        let result: CodeSnippetCallSuccess<T> | undefined;
        await handlePromise(
          Promise.all(Object.values(retryAfterPromises)).then(async () => {
            result = await this.call(locals).promise;
            return undefined;
          })
        );
        if (!result)
          reject(new Error("handlePromise did not run all its jobs"));
        else resolve(result);
      }),
    };
  }

  async commit({
    sideEffects,
  }: {
    sideEffects: CodeSnippetSideEffect[];
  }): Promise<void> {
    await this.handlePromise(
      Promise.all(sideEffects.map((sideEffect) => sideEffect.run()))
    );
  }
}
