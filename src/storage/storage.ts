import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getString(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn("read storage failed", key, error);
    return null;
  }
}

export async function setString(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn("write storage failed", key, error);
  }
}

export async function remove(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn("remove storage failed", key, error);
  }
}

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("parse storage failed", key, error);
    return fallback;
  }
}

export async function setJson<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("write storage failed", key, error);
  }
}
