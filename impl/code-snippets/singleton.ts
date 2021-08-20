import { CodeSnippetSingleton_forTheWorld } from '../../interface/code-snippets/singleton';
import {
  ValueName,
  Value_asSeenByIts_owners,
  ValueRegistry_asSeenByIts_refs,
} from '../../interface/values/sinks-and-sources';
import { CodeSnippetValue } from './code-snippet-value';
import { valuesSingleton } from '../../interface/values/singleton';

class CodeSnippetSingleton implements CodeSnippetSingleton_forTheWorld {
  private _codeSnippetSourceRegistry?: ValueRegistry_asSeenByIts_refs<CodeSnippetValue>;
  get codeSnippetValueRegistry(): ValueRegistry_asSeenByIts_refs<CodeSnippetValue> {
    return (
      this._codeSnippetSourceRegistry ||
      (this._codeSnippetSourceRegistry = valuesSingleton.createValueRegistry({
        sourceGenerator: this.codeSnippetSourceGenerator,
        SourceCleaningPolicy: valuesSingleton.createSourceCleaningPolicy({
          handlePromise: generalSingleton.handlePromise,
        }),
      }))
    );
  }
  codeSnippetSourceGenerator(name: ValueName<CodeSnippet>): Value_asSeenByIts_owners<CodeSnippet> {}
}

export var codeSnippetSingleton = new CodeSnippetSingleton();
