import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJson, getString, remove, setJson, setString } from "../storage";

describe("storage helpers", () => {
  beforeEach(async () => {
    await (AsyncStorage as any).clear?.();
    jest.restoreAllMocks();
  });

  it("sets, gets and removes string values", async () => {
    await setString("key", "value");
    expect(await getString("key")).toBe("value");

    await remove("key");
    expect(await getString("key")).toBeNull();
  });

  it("handles JSON serialization and parsing errors gracefully", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await setJson("json", { ok: true });
    expect(await getJson("json", null)).toEqual({ ok: true });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("{bad json");
    expect(await getJson("json", { fallback: true })).toEqual({ fallback: true });
    expect(warnSpy).toHaveBeenCalled();

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    await setJson("json", { another: true });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("swallows storage errors but logs warning", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await setString("bad", "x");

    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    expect(await getString("bad")).toBeNull();

    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await remove("bad");

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
