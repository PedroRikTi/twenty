import { getNamespacedStorageKeys } from '@/host/storage/utils/getNamespacedStorageKeys';
import { type FrontComponentStorageScope } from '@/types/FrontComponentStorageScope';

export const clearFrontComponentStorage = ({
  namespace,
  storageType,
}: FrontComponentStorageScope): void => {
  const storage = (window as any)[storageType] as Storage;

  for (const namespacedKey of getNamespacedStorageKeys({
    storage,
    namespace,
  })) {
    storage.removeItem(namespacedKey);
  }
};
