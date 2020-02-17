import { anyValue } from '../../interface/general/any';
import { CodeSnippet_publicInterface } from '../../interface/code-snippets/code-snippet';
import { Caster } from '../../interface/general/caster';

import permissableGlobals from './permissable-globals';

export class CodeSnippet<T> implements CodeSnippet_publicInterface<T> {
  codeString: string;
  maskGlobals: string[];
  func: (...args: anyValue[]) => T;

  constructor(codeString: string, caster: Caster<T>) {
    this.codeString = codeString;
    this.maskGlobals = Array.from(CodeSnippet.potentialGlobalsFromCodeString(codeString));
    const func = new Function(...this.maskGlobals, this.codeString);
    this.func = function() {
      return caster(func.call(null, arguments));
    };
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
