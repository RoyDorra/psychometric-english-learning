import { STORAGE_KEYS } from "../keys";

describe("STORAGE_KEYS", () => {
  it("scopes per-user values for user-specific keys", () => {
    const userId = "user-123";
    expect(STORAGE_KEYS.STATUSES(userId)).toBe("@pel/statuses:user-123");
    expect(STORAGE_KEYS.PRIVATE_ASSOCIATIONS(userId)).toBe("@pel/privateAssociations:user-123");
    expect(STORAGE_KEYS.ASSOCIATION_LIKES(userId)).toBe("@pel/associationLikes:user-123");
    expect(STORAGE_KEYS.ASSOCIATION_SAVES(userId)).toBe("@pel/associationSaves:user-123");
  });

  it("keeps shared keys stable", () => {
    expect(STORAGE_KEYS.PUBLIC_ASSOCIATIONS).toBe("@pel/publicAssociations");
    expect(STORAGE_KEYS.USERS).toBe("@pel/users");
    expect(STORAGE_KEYS.SESSION).toBe("@pel/session");
  });

  it("generates distinct keys for different users", () => {
    expect(STORAGE_KEYS.STUDY_PREFS("a")).not.toBe(STORAGE_KEYS.STUDY_PREFS("b"));
    expect(STORAGE_KEYS.REVIEW_PREFS("a")).not.toBe(STORAGE_KEYS.REVIEW_PREFS("b"));
    expect(STORAGE_KEYS.HELP("one")).toBe("@pel/help:one");
  });
});
