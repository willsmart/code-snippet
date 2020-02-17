import { GeneralSingleton_publicInterface } from '../../interface/general/singleton';
import {
  PromiseOrPromiseGenerator,
  PromiseHandlerOwner_promiseHandlerInterface,
} from '../../interface/general/promise-handler';

import DelayedCaller from './delayed-caller';
import mapValues from './map-values';
import isPromise from './is-promise';
import { IntervalPromiseHandlerOwner } from './promise-handler/interval-promise-handler-owner';
import { PromiseHandler } from './promise-handler/promise-handler';

class GeneralSingleton implements GeneralSingleton_publicInterface {
  createDelayedCaller({ delayMs, sliceMs }: { delayMs: number; sliceMs: number }): DelayedCaller {
    return new DelayedCaller({ delayMs, sliceMs });
  }

  mapValues = mapValues;

  isPromise = isPromise;

  handlePromise(promise: PromiseOrPromiseGenerator): Promise<void> {
    return this.promiseHandler.handle(promise);
  }

  get promiseOwner() {
    return this._promiseOwner || (this._promiseOwner = new IntervalPromiseHandlerOwner());
  }
  set promiseOwner(promiseOwner) {
    this._promiseOwner = promiseOwner;
    this._promiseHandler = undefined;
  }

  private _promiseHandler?: PromiseHandler;
  private get promiseHandler() {
    return this._promiseHandler || (this._promiseHandler = new PromiseHandler(this.promiseOwner));
  }
  private _promiseOwner?: PromiseHandlerOwner_promiseHandlerInterface;
}

export var generalSingleton = new GeneralSingleton();
