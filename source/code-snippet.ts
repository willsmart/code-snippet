import permissableGlobals from "./permissable-globals";
import { anyValue } from "../interface/any";
import { Caster } from "../interface/misc";

export class CodeSnippet<T> {
  codeString: string;
  maskGlobals: string[];
  func: (...args: anyValue[]) => T;

  constructor(codeString: string, caster: Caster<T>) {
    this.codeString = codeString;
    this.maskGlobals = Array.from(
      CodeSnippet.potentialGlobalsFromCodeString(codeString)
    );
    const func = new Function(...this.maskGlobals, this.codeString);
    this.func = function () {
      return caster(func.call(null, arguments));
    };
  }

  static potentialGlobalsFromCodeString(codeString: string) {
    const words = new Set<string>(),
      regex = /(?<!\.)\b\w+\b/g; // TODO, this regex is pretty damn basic. It could be made much more refined
    for (let word: string | undefined; (word = regex.exec(codeString)?.[0]); ) {
      if (!permissableGlobals.has(word)) words.add(word);
    }
    return words;
  }
}
