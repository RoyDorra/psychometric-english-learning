import * as Crypto from "expo-crypto";

export function uuid() {
  try {
    if (typeof Crypto.randomUUID === "function") {
      return Crypto.randomUUID();
    }
  } catch {
    // fall through to other strategies
  }

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
