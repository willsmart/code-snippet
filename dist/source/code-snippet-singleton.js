"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nobo_singleton_1 = require("../interface/nobo-singleton");
class CodeSnippetSingleton {
    get codeSnippetSourceRegistry() {
        return (this._codeSnippetSourceRegistry ||
            (this._codeSnippetSourceRegistry = nobo_singleton_1.noboSingleton.createValueSourceRegistry({ sourceGenerator: this.codeSnippetSourceGenerator, valueSourceCleaningPolicy:  })));
    }
    codeSnippetSourceGenerator(name) { }
}
exports.codeSnippetSingleton = new CodeSnippetSingleton();
//# sourceMappingURL=code-snippet-singleton.js.map