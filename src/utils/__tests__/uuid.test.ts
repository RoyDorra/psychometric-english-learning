import * as Crypto from "expo-crypto";
import { uuid } from "../uuid";

describe("uuid", () => {
  const originalGlobalCrypto = globalThis.crypto;
  const originalRandomUuid = Crypto.randomUUID;

  afterEach(() => {
    (Crypto as any).randomUUID = originalRandomUuid;
    globalThis.crypto = originalGlobalCrypto;
    jest.restoreAllMocks();
  });

  it("prefers expo-crypto randomUUID when available", () => {
    const value = "12345678-1234-1234-1234-123456789012";
    const spy = jest
      .spyOn(Crypto, "randomUUID")
      .mockReturnValueOnce(value);

    expect(uuid()).toBe(value);
    expect(spy).toHaveBeenCalled();
  });

  it("falls back to global crypto when expo-crypto randomUUID is missing", () => {
    (Crypto as any).randomUUID = undefined;
    const fallbackValue = "abcdef12-3456-7890-abcd-ef1234567890";
    const globalMock = jest.fn<
      `${string}-${string}-${string}-${string}-${string}`,
      []
    >(() => fallbackValue);
    globalThis.crypto = { ...(originalGlobalCrypto ?? {}), randomUUID: globalMock };

    expect(uuid()).toBe(fallbackValue);
    expect(globalMock).toHaveBeenCalled();
  });
});
