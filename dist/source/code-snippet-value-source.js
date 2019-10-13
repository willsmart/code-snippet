"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_snippet_1 = require("./code-snippet");
const abstract_constant_value_source_1 = require("../interface/abstract-constant-value-source");
class CodeSnippetValueSource extends abstract_constant_value_source_1.AbstractConstantValueSource {
    constructor({ interfacePassback, codeString, }) {
        super({ interfacePassback, rawValue: codeString, valueTransform: s => new code_snippet_1.CodeSnippet(s) });
    }
}
exports.CodeSnippetValueSource = CodeSnippetValueSource;
//# sourceMappingURL=code-snippet-value-source.js.map