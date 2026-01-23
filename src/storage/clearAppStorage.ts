import { STORAGE_KEYS } from "./keys";
import { remove } from "./storage";

export async function clearAppStorage(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  for (const key of keys) {
    await remove(key);
  }
}
