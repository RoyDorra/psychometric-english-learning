import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import AsyncStorage from "@react-native-async-storage/async-storage";

process.env.EXPO_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock("expo-crypto", () => {
  let counter = 0;
  return {
    CryptoDigestAlgorithm: { SHA256: "SHA256" },
    getRandomBytesAsync: jest.fn(
      async (length: number) => new Uint8Array(length).fill(1),
    ),
    digestStringAsync: jest.fn(
      async (_algorithm: string, value: string) => `hashed:${value}`,
    ),
    randomUUID: jest.fn(
      () => `mock-random-uuid-${++counter}-${Date.now()}`,
    ),
  };
});

const suppressedWarnings = [
  /Animated: `useNativeDriver` is not supported/,
  /VirtualizedLists should never be nested/,
];

const originalWarn = console.warn;
console.warn = (...args: Parameters<typeof originalWarn>) => {
  const message = args[0];
  if (typeof message === "string" && suppressedWarnings.some((pattern) => pattern.test(message))) {
    return;
  }
  originalWarn(...args);
};

afterEach(async () => {
  jest.clearAllMocks();
  if (typeof (AsyncStorage as any).clear === "function") {
    await (AsyncStorage as any).clear();
  }
});
