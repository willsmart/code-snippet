import { CodeSnippet } from "./code-snippet";
import { ValueSourceInterfacePassback } from "../interface/abstract-value-source";
import { AbstractConstantValueSource } from "../interface/abstract-constant-value-source";

export class CodeSnippetValueSource extends AbstractConstantValueSource<CodeSnippet, string> {
  constructor({
    interfacePassback,
    codeString,
  }: {
    interfacePassback: ValueSourceInterfacePassback<CodeSnippet>;
    codeString: string;
  }) {
    super({ interfacePassback, rawValue: codeString, valueTransform: s => new CodeSnippet(s) });
  }
}
