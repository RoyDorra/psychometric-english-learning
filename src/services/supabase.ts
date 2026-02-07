import "react-native-url-polyfill/auto";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function createMemoryStorageAdapter(): StorageAdapter {
  const memory = new Map<string, string>();
  return {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: async (key: string) => {
      memory.delete(key);
    },
  };
}

function createWebLocalStorageAdapter(): StorageAdapter {
  return {
    getItem: async (key: string) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignore storage write failures (e.g. private mode or denied quota).
      }
    },
    removeItem: async (key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore storage removal failures.
      }
    },
  };
}

function createNativeAsyncStorageAdapter(): StorageAdapter {
  const asyncStorageModule = require("@react-native-async-storage/async-storage");
  const AsyncStorage = (asyncStorageModule?.default ??
    asyncStorageModule) as StorageAdapter;
  return {
    getItem: AsyncStorage.getItem.bind(AsyncStorage),
    setItem: AsyncStorage.setItem.bind(AsyncStorage),
    removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
  };
}

function resolveAuthStorage(): StorageAdapter {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      return createWebLocalStorageAdapter();
    }
    return createMemoryStorageAdapter();
  }
  return createNativeAsyncStorageAdapter();
}

type ExpoExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase config missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or expo.extra.supabaseUrl / expo.extra.supabaseAnonKey).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: resolveAuthStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
