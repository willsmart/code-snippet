import { CodeSnippetSingleton_publicInterface } from '../../interface/code-snippets/singleton';
import { ValueName, Value_ownerInterface, ValueRegistry_refInterface } from '../../interface/values/refs-and-values';
import { CodeSnippetValue } from './code-snippet-value';
import { valuesSingleton } from '../../interface/values/singleton';

class CodeSnippetSingleton implements CodeSnippetSingleton_publicInterface {
  private _codeSnippetSourceRegistry?: ValueRegistry_refInterface<CodeSnippetValue>;
  get codeSnippetValueRegistry(): ValueRegistry_refInterface<CodeSnippetValue> {
    return (
      this._codeSnippetSourceRegistry ||
      (this._codeSnippetSourceRegistry = valuesSingleton.createValueRegistry({
        sourceGenerator: this.codeSnippetSourceGenerator,
        valueCleaningPolicy: valuesSingleton.createValueCleaningPolicy({
          handlePromise: generalSingleton.handlePromise,
        }),
      }))
    );
  }
  codeSnippetSourceGenerator(name: ValueName<CodeSnippet>): Value_ownerInterface<CodeSnippet> {}
}

export var codeSnippetSingleton = new CodeSnippetSingleton();
