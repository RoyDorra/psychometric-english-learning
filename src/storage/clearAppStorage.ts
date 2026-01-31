import { STORAGE_KEYS } from "./keys";
import { remove } from "./storage";

export async function clearAppStorage(userId?: string): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  for (const key of keys) {
    if (typeof key === "string") {
      await remove(key);
    } else if (userId) {
      await remove(key(userId));
    }
  }
}
