"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeSnippetCaller = void 0;
const code_snippet_object_proxy_manager_1 = require("./code-snippet-object-proxy-manager");
const unasync_value_1 = __importDefault(require("./unasync-value"));
const nobo_singleton_1 = require("../interface/nobo-singleton");
class CodeSnippetCaller {
    codeSnippet;
    localArgs;
    handlePromise;
    /// Tests:
    ///   retains the arguments it was constructed with
    ///   uses the singleton's handlePromise by default
    constructor({ codeSnippet, localArgs = {}, handlePromise, }) {
        this.codeSnippet = codeSnippet;
        this.localArgs = localArgs;
        this.handlePromise = handlePromise || nobo_singleton_1.noboSingleton.handlePromise;
    }
    call(localOverrides = {}) {
        let needsRetry;
        const retryAfterPromises = {}, sideEffectIndexesByName = {}, sideEffects = [], callInstance = {
            retryAfterPromise(promise, name) {
                retryAfterPromises[name] = promise;
                needsRetry = true;
            },
            registerSideEffect(sideEffect, name) {
                if (name) {
                    if (name in sideEffectIndexesByName)
                        return;
                    sideEffectIndexesByName[name] = sideEffects.length;
                }
                sideEffects.push(sideEffect);
            },
        };
        const localProxyMgrs = {};
        const locals = {};
        const { localArgs, codeSnippet, handlePromise } = this;
        for (const key of Object.keys(localArgs)) {
            let { value: localValue, valueGetter, defaultValueForKeyPath, } = localArgs[key];
            if (valueGetter)
                localValue = valueGetter(callInstance);
            const v = (0, unasync_value_1.default)(callInstance, defaultValueForKeyPath, key, key in localOverrides ? localOverrides[key] : localValue, (value) => {
                localOverrides[key] = value;
            });
            locals[key] = localValue = v;
            if (!localValue || typeof localValue !== "object")
                continue;
            let haveRegisteredSideEffect = false;
            locals[key] = (localProxyMgrs[key] = new code_snippet_object_proxy_manager_1.CodeSnippetObjectProxyManager(`${key}`, localValue, unasync_value_1.default.bind(this, callInstance, defaultValueForKeyPath), () => {
                if (haveRegisteredSideEffect)
                    return;
                haveRegisteredSideEffect = true;
                callInstance.registerSideEffect({
                    run: () => {
                        localProxyMgrs[key].commit();
                        return undefined;
                    },
                    name: `commit local '${key}'`,
                });
            }, callInstance)).proxy;
        }
        const result = codeSnippet.func(codeSnippet.maskGlobals.map((key) => key in locals && locals[key]));
        if (!needsRetry) {
            return { promise: Promise.resolve({ result, sideEffects }) };
        }
        return {
            retryingAfterPromises: Object.keys(retryAfterPromises),
            promise: new Promise(async (resolve, reject) => {
                let result;
                await handlePromise(Promise.all(Object.values(retryAfterPromises)).then(async () => {
                    result = await this.call(locals).promise;
                    return undefined;
                }));
                if (!result)
                    reject(new Error("handlePromise did not run all its jobs"));
                else
                    resolve(result);
            }),
        };
    }
    async commit({ sideEffects, }) {
        await this.handlePromise(Promise.all(sideEffects.map((sideEffect) => sideEffect.run())));
    }
}
exports.CodeSnippetCaller = CodeSnippetCaller;
//# sourceMappingURL=code-snippet-caller.js.map