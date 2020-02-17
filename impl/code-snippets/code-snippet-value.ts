import { CodeSnippet } from './code-snippet';
import { ConstantValue, ConstantValue_constructorArgPassback } from '../values/constant';

export class CodeSnippetValue extends ConstantValue<CodeSnippet<string>> {
  constructor({
    interfacePassback,
    codeString,
  }: {
    interfacePassback: ConstantValue_constructorArgPassback<CodeSnippet<string>>;
    codeString: string;
  }) {
    super({ interfacePassback, value: new CodeSnippet(codeString, caster:) });
  }
}
