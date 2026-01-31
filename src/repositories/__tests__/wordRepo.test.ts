import {
  DEFAULT_CHUNK_SIZE,
  getReviewFilters,
  getStudyPreferences,
  getStatuses,
  getWords,
  getWordsByGroup,
  getWordById,
  setReviewFilters,
  setStatus,
  setStudyPreferences,
} from "../wordRepo";
import type { WordStatus } from "@/src/domain/types";
import { createFakeStorage, installFakeStorage } from "@/test/fakeStorage";

describe("wordRepo", () => {
  beforeEach(() => {
    installFakeStorage(createFakeStorage());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves group identifiers and returns matching words", () => {
    const numeric = getWordsByGroup(1);
    const bySlug = getWordsByGroup("group-1");
    expect(bySlug.length).toBeGreaterThan(0);
    expect(numeric[0]?.id).toEqual(bySlug[0]?.id);

    const none = getWordsByGroup("nope");
    expect(none).toEqual([]);
  });

  it("finds words by id and returns null when missing", () => {
    const all = getWords();
    expect(all.length).toBeGreaterThan(0);
    const first = all[0];
    expect(getWordById(first.id)).toEqual(first);
    expect(getWordById("does-not-exist")).toBeNull();
  });

  it("stores statuses per user and returns clones", async () => {
    const userId = "user-a";
    await setStatus(userId, "word-1", "KNOW");
    const first = await getStatuses(userId);
    expect(first).toEqual({ "word-1": "KNOW" });

    first["word-1"] = "UNMARKED";
    const second = await getStatuses(userId);
    expect(second["word-1"]).toBe("KNOW");
  });

  it("persists study preferences with sensible defaults", async () => {
    const userId = "user-b";
    const defaults = await getStudyPreferences(userId);
    expect(defaults.chunkSize).toBe(DEFAULT_CHUNK_SIZE);

    const updated = { chunkSize: 5, statuses: ["KNOW"] as WordStatus[] };
    await setStudyPreferences(userId, updated);
    const stored = await getStudyPreferences(userId);
    expect(stored).toEqual(updated);
  });

  it("stores review filters separately per user", async () => {
    const userId = "user-c";
    const otherUser = "user-d";
    await setReviewFilters(userId, { groups: ["group-1"], statuses: ["KNOW"] });
    const mine = await getReviewFilters(userId);
    const theirs = await getReviewFilters(otherUser);

    expect(mine).toEqual({ groups: ["group-1"], statuses: ["KNOW"] });
    expect(theirs.groups).not.toEqual(mine.groups);
  });
});
