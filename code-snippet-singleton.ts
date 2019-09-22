import { CodeSnippetSingleton_publicInterface } from "./interfaces/code-snippet-singleton";
import { SourceRegistry_sinkInterface, SourceName, ValueSource_ownerInterface } from "./interfaces/sinks-and-sources";
import { noboSingleton } from "./interfaces/nobo-singleton";
import { CodeSnippet } from "./code-snippet";

class CodeSnippetSingleton implements CodeSnippetSingleton_publicInterface {
  private _codeSnippetSourceRegistry?: SourceRegistry_sinkInterface<CodeSnippet>;
  get codeSnippetSourceRegistry(): SourceRegistry_sinkInterface<CodeSnippet> {
    return (
      this._codeSnippetSourceRegistry ||
      (this._codeSnippetSourceRegistry = noboSingleton.createValueSourceRegistry({ sourceGenerator: this.codeSnippetSourceGenerator ,valueSourceCleaningPolicy: }))
    );
  }
  codeSnippetSourceGenerator(name: SourceName<CodeSnippet>): ValueSource_ownerInterface<CodeSnippet> {}
}

export var codeSnippetSingleton = new CodeSnippetSingleton();
