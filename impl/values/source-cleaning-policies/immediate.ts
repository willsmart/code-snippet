import { HandlePromise } from '../../../interface/general/promise-handler';

export default ({ handlePromise }: { handlePromise: HandlePromise }) => ({
  queueCleanup(_name: string, cleanupCallback: () => Promise<void>) {
    handlePromise(cleanupCallback());
  },
  cancelCleanup(_name: string): void {},
});
