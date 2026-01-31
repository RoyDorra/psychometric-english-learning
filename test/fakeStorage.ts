import AsyncStorage from "@react-native-async-storage/async-storage";
import * as storage from "@/src/storage/storage";

export type FakeStorage = {
  store: Map<string, string>;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getJson: <T>(key: string, fallback: T) => Promise<T>;
  setJson: <T>(key: string, value: T) => Promise<void>;
};

export function createFakeStorage(
  initial: Record<string, unknown> = {},
): FakeStorage {
  const store = new Map<string, string>();
  for (const [key, value] of Object.entries(initial)) {
    store.set(key, JSON.stringify(value));
  }

  const getItem = async (key: string) => store.get(key) ?? null;
  const setItem = async (key: string, value: string) => {
    store.set(key, value);
  };
  const removeItem = async (key: string) => {
    store.delete(key);
  };
  const clear = async () => {
    store.clear();
  };
  const getJson = async <T>(key: string, fallback: T): Promise<T> => {
    const raw = await getItem(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };
  const setJson = async <T>(key: string, value: T) => {
    await setItem(key, JSON.stringify(value));
  };

  return { store, getItem, setItem, removeItem, clear, getJson, setJson };
}

export function installFakeStorage(fake: FakeStorage) {
  jest.spyOn(AsyncStorage, "getItem").mockImplementation(fake.getItem);
  jest.spyOn(AsyncStorage, "setItem").mockImplementation(fake.setItem);
  jest.spyOn(AsyncStorage, "removeItem").mockImplementation(fake.removeItem);
  if (typeof (AsyncStorage as any).clear === "function") {
    jest.spyOn(AsyncStorage as any, "clear").mockImplementation(fake.clear);
  }

  jest.spyOn(storage, "getString").mockImplementation(fake.getItem);
  jest.spyOn(storage, "setString").mockImplementation(fake.setItem);
  jest.spyOn(storage, "remove").mockImplementation(fake.removeItem);
  jest.spyOn(storage, "getJson").mockImplementation(fake.getJson);
  jest.spyOn(storage, "setJson").mockImplementation(fake.setJson);

  return fake;
}
