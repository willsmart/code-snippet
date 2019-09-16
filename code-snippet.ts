import permissableGlobals from "./permissable-globals";
import { HandlePromise } from "./interfaces/promise-handler";

export class CodeSnippet {
  codeString: string;
  handlePromise: HandlePromise;
  maskGlobals: string[];
  func: Function;

  constructor(codeString: string, handlePromise: HandlePromise) {
    this.codeString = codeString;
    this.handlePromise = handlePromise;
    this.maskGlobals = Array.from(CodeSnippet.potentialGlobalsFromCodeString(codeString));
    this.func = new Function(...this.maskGlobals, this.codeString);
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
