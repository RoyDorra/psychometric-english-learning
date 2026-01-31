import { clearAppStorage } from "../clearAppStorage";
import { STORAGE_KEYS } from "../keys";
import * as storage from "../storage";

describe("clearAppStorage", () => {
  it("removes shared and user-scoped keys when userId is provided", async () => {
    const spy = jest
      .spyOn(storage, "remove")
      .mockResolvedValue(undefined as unknown as void);

    await clearAppStorage("user-x");

    const expectedUserKeys = Object.values(STORAGE_KEYS).filter(
      (key) => typeof key === "function",
    );
    const expectedSharedKeys = Object.values(STORAGE_KEYS).filter(
      (key) => typeof key === "string",
    );

    expect(spy).toHaveBeenCalledTimes(
      expectedUserKeys.length + expectedSharedKeys.length,
    );
    expect(spy).toHaveBeenCalledWith(STORAGE_KEYS.USERS);
    expect(spy).toHaveBeenCalledWith(STORAGE_KEYS.SESSION);
    expect(spy).toHaveBeenCalledWith(STORAGE_KEYS.PRIVATE_ASSOCIATIONS("user-x"));
  });

  it("skips user-specific keys when userId is missing", async () => {
    const spy = jest
      .spyOn(storage, "remove")
      .mockResolvedValue(undefined as unknown as void);

    await clearAppStorage();

    expect(spy).toHaveBeenCalledWith(STORAGE_KEYS.PUBLIC_ASSOCIATIONS);
    expect(spy).not.toHaveBeenCalledWith(STORAGE_KEYS.PRIVATE_ASSOCIATIONS("any"));
  });
});
