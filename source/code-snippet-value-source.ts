import { CodeSnippet } from "./code-snippet";
import { ValueSourceInterfacePassback } from "../interface/abstract-value-source";
import { AbstractConstantValueSource } from "../interface/abstract-constant-value-source";
import { Caster } from "../interface/misc";

export class CodeSnippetValueSource<T> extends AbstractConstantValueSource<
  CodeSnippet<T>,
  string
> {
  constructor({
    interfacePassback,
    codeString,
    caster,
  }: {
    interfacePassback: ValueSourceInterfacePassback<CodeSnippet<T>>;
    codeString: string;
    caster: Caster<T>;
  }) {
    super({
      interfacePassback,
      rawValue: codeString,
      valueTransform: (s) => new CodeSnippet<T>(s, caster),
    });
  }
}
