import { CodeSnippetSingleton_publicInterface } from "../interface/code-snippet-singleton";
import { SourceRegistry_sinkInterface } from "../interface/source-registry";
import { noboSingleton } from "../interface/nobo-singleton";
import { CodeSnippet } from "./code-snippet";
import { CodeSnippetValueSource } from "./code-snippet-value-source";
import { ValueSourceInterfacePassback } from "../interface/abstract-value-source";
import { anyValue } from "../interface/any";
import { Caster } from "../interface/misc";
import {
  SourceName,
  ValueSource_ownerInterface,
} from "../interface/value-source";

class CodeSnippetSingleton<T>
  implements CodeSnippetSingleton_publicInterface<T>
{
  constructor({ caster }: { caster: Caster<T> }) {
    this.caster = caster;
  }
  readonly caster: Caster<T>;
  private _codeSnippetSourceRegistry?: SourceRegistry_sinkInterface<
    CodeSnippet<T>
  >;
  get codeSnippetSourceRegistry(): SourceRegistry_sinkInterface<
    CodeSnippet<T>
  > {
    const { handlePromise, delayedSourceCleaningPolicy } = noboSingleton;
    return (
      this._codeSnippetSourceRegistry ||
      (this._codeSnippetSourceRegistry =
        noboSingleton.createValueSourceRegistry({
          sourceGenerator: this.codeSnippetSourceGenerator,
          valueSourceCleaningPolicy: delayedSourceCleaningPolicy({
            handlePromise,
            delayMs: 1000,
            sliceMs: 100,
          }),
        }))
    );
  }
  codeSnippetSourceGenerator(
    name: SourceName<CodeSnippet<T>>
  ): ValueSource_ownerInterface<CodeSnippet<T>> {
    const { caster } = this,
      interfacePassback: ValueSourceInterfacePassback<CodeSnippet<T>> = {},
      _source = new CodeSnippetValueSource<T>({
        interfacePassback,
        codeString: name.toString(),
        caster,
      });
    return <ValueSource_ownerInterface<CodeSnippet<T>>>interfacePassback.owner;
  }
}

export var codeSnippetSingleton = new CodeSnippetSingleton<anyValue>({
  caster: (v) => v,
});
