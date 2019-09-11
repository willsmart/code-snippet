export type HandlePromise = (promise: PromiseOrPromiseGenerator) => Promise<void>;
export type PromiseOrPromiseGenerator =
  | Promise<any>
  | ((handlePromise: HandlePromise) => PromiseOrPromiseGenerator | undefined);
