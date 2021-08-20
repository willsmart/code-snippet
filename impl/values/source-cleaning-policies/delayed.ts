import { HandlePromise } from '../../../interface/general/promise-handler';
import { generalSingleton } from '../../general/singleton';
import SourceCleaningPolicy_forTheWorld from '../../../interface/values/cleaning-policy';
import DelayedCaller from '../../general/delayed-caller';

class DelayedCleaningPolicy implements SourceCleaningPolicy_forTheWorld {
  delayedCaller: DelayedCaller;
  handlePromise: HandlePromise;

  constructor({
    handlePromise,
    delayMs = 1000,
    sliceMs = 100,
  }: {
    handlePromise: HandlePromise;
    delayMs?: number;
    sliceMs?: number;
  }) {
    this.handlePromise = handlePromise;
    this.delayedCaller = generalSingleton.createDelayedCaller({ delayMs, sliceMs });
  }

  queueCleanup({ key, cleanupCallback }: { key: string; cleanupCallback: () => Promise<void> }) {
    this.delayedCaller.enqueue(key, () => this.handlePromise(cleanupCallback()));
  }

  cancelCleanup(_name: string): void {
    this.delayedCaller.cancel(name);
  }
}

export default (options: {
  handlePromise: HandlePromise;
  delayMs?: number;
  sliceMs?: number;
}): SourceCleaningPolicy_forTheWorld => new DelayedCleaningPolicy(options);
