"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeSnippetSingleton = void 0;
const nobo_singleton_1 = require("../interface/nobo-singleton");
const code_snippet_value_source_1 = require("./code-snippet-value-source");
class CodeSnippetSingleton {
    constructor({ caster }) {
        this.caster = caster;
    }
    caster;
    _codeSnippetSourceRegistry;
    get codeSnippetSourceRegistry() {
        const { handlePromise, delayedSourceCleaningPolicy } = nobo_singleton_1.noboSingleton;
        return (this._codeSnippetSourceRegistry ||
            (this._codeSnippetSourceRegistry =
                nobo_singleton_1.noboSingleton.createValueSourceRegistry({
                    sourceGenerator: this.codeSnippetSourceGenerator,
                    valueSourceCleaningPolicy: delayedSourceCleaningPolicy({
                        handlePromise,
                        delayMs: 1000,
                        sliceMs: 100,
                    }),
                })));
    }
    codeSnippetSourceGenerator(name) {
        const { caster } = this, interfacePassback = {}, _source = new code_snippet_value_source_1.CodeSnippetValueSource({
            interfacePassback,
            codeString: name.toString(),
            caster,
        });
        return interfacePassback.owner;
    }
}
exports.codeSnippetSingleton = new CodeSnippetSingleton({
    caster: (v) => v,
});
//# sourceMappingURL=code-snippet-singleton.js.map