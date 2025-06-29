"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeSnippet = void 0;
const permissable_globals_1 = __importDefault(require("./permissable-globals"));
class CodeSnippet {
    codeString;
    maskGlobals;
    func;
    constructor(codeString, caster) {
        this.codeString = codeString;
        this.maskGlobals = Array.from(CodeSnippet.potentialGlobalsFromCodeString(codeString));
        const func = new Function(...this.maskGlobals, this.codeString);
        this.func = function () {
            return caster(func.call(null, arguments));
        };
    }
    static potentialGlobalsFromCodeString(codeString) {
        const words = new Set(), regex = /(?<!\.)\b\w+\b/g; // TODO, this regex is pretty damn basic. It could be made much more refined
        for (let word; (word = regex.exec(codeString)?.[0]);) {
            if (!permissable_globals_1.default.has(word))
                words.add(word);
        }
        return words;
    }
}
exports.CodeSnippet = CodeSnippet;
//# sourceMappingURL=code-snippet.js.map