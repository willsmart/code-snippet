class NoboSingleton implements NoboSingleton_publicInterface {
  createValueSourceRegistry<T>({
    sourceGenerator,
    valueSourceCleaningPolicy,
  }: {
    sourceGenerator: SourceGenerator<T>;
    valueSourceCleaningPolicy: ValueSourceCleaningPolicy;
  }): ValueSourceRegistry_publicInterface<T> {
    return new ValueSourceRegistry<T>({ sourceGenerator, valueSourceCleaningPolicy });
  }
  createDelayedCaller({ delayMs, sliceMs }: { delayMs: number; sliceMs: number }): DelayedCaller {
    return new DelayedCaller({ delayMs, sliceMs });
  }

  delayedSourceCleaningPolicy({
    handlePromise,
    delayMs,
    sliceMs,
  }: {
    handlePromise: HandlePromise;
    delayMs: number;
    sliceMs: number;
  }): ValueSourceCleaningPolicy_publicInterface {
    return delayedSourceCleaningPolicy({ handlePromise: handlePromise || this.handlePromise, delayMs, sliceMs });
  }
  isPromise = isPromise;
  mapValues = mapValues;
  standardSourceRegistries = standardSourceRegistries;

  private _promiseHandler?: PromiseHandler;
  get promiseHandler() {
    return this._promiseHandler || (this._promiseHandler = new PromiseHandler(this.promiseOwner));
  }

  handlePromise(promise: PromiseOrPromiseGenerator): Promise<void> {
    return this.promiseHandler.handle(promise);
  }

  private _promiseOwner?: PromiseHandlerOwner_promiseHandlerInterface;
  get promiseOwner() {
    return this._promiseOwner || (this._promiseOwner = new IntervalPromiseHandlerOwner());
  }

  set promiseOwner(promiseOwner) {
    this._promiseOwner = promiseOwner;
    this._promiseHandler = undefined;
  }
}

export var noboSingleton = new NoboSingleton();
