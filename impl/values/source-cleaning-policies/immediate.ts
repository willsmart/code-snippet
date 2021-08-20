import { HandlePromise } from '../../../interface/general/promise-handler';
import SourceCleaningPolicy_forTheWorld from '../../../interface/values/cleaning-policy';

export default ({ handlePromise }: { handlePromise: HandlePromise }): SourceCleaningPolicy_forTheWorld => ({
  queueCleanup({ cleanupCallback }: { cleanupCallback: () => Promise<void> }) {
    handlePromise(cleanupCallback());
  },
  cancelCleanup(_name: string): void {},
});
