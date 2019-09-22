import permissableGlobals from "./permissable-globals";
import {
  ValueSourceRegistry_publicInterface,
  SourceGenerator,
  ValueSource_ownerInterface,
  ValueSource_sinkInterface,
  ValueSource_stateForOwner,
  ValueSink_publicInterface,
} from "./interfaces/sinks-and-sources";
import { anyValue } from "./interfaces/any";

export class CodeSnippetSourceGenerator implements SourceGenerator<CodeSnippet> {}
export class CodeSnippet implements ValueSource_abstract<CodeSnippet> {
  addSink(sink: ValueSink_publicInterface<CodeSnippet>): ValueSink_publicInterface<CodeSnippet> {
    throw new Error("Method not implemented.");
  }
  removeSink(sink: ValueSink_publicInterface<CodeSnippet>): ValueSource_stateForOwner {
    throw new Error("Method not implemented.");
  }
  cleanup(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  sinkInterface(): ValueSource_sinkInterface<CodeSnippet> {}

  codeString: string;
  maskGlobals: string[];
  func: Function;

  constructor(codeString: string) {
    this.codeString = codeString;
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
