import { CodeSnippet } from "./code-snippet";
import { ValueSource_abstract, ValueSourceInterfacePassback } from "./interfaces/value-source-abstract";

export class CodeSnippetValueSource extends ValueSource_abstract<CodeSnippet> {
  protected valueFromSubclass(): Promise<CodeSnippet> {
    return Promise.resolve(this.cachedValue);
  }

  setValueInSubclass(): undefined {
    return undefined;
  }

  constructor({
    interfacePassback,
    codeString,
  }: {
    interfacePassback: ValueSourceInterfacePassback<CodeSnippet>;
    codeString: string;
  }) {
    super({ interfacePassback, value: new CodeSnippet(codeString), valid: true });
  }
}
