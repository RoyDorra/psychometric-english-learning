jest.mock("@/src/services/supabase", () => {
  const { mockSupabase } = require("@/test/supabaseInMemory");
  return { supabase: mockSupabase };
});

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
import {
  queueMockError,
  resetMockSupabase,
  writeMockTable,
} from "@/test/supabaseInMemory";

describe("wordRepo", () => {
  beforeEach(() => {
    resetMockSupabase();
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

  it("stores statuses per user and keeps only non-default statuses", async () => {
    const userId = "user-a";
    await setStatus(userId, "word-1", "KNOW");
    const first = await getStatuses(userId);
    expect(first).toEqual({ "word-1": "KNOW" });

    await setStatus(userId, "word-1", "UNMARKED");
    const second = await getStatuses(userId);
    expect(second).toEqual({});
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

  it("normalizes malformed persisted state and falls back to defaults", async () => {
    writeMockTable("user_learning_state", [
      {
        user_id: "user-x",
        state: {
          v: 99,
          s: { keep: "KNOW", dropA: "UNMARKED", dropB: "INVALID" },
          sp: { c: -3, m: 0 },
          rf: { g: 0, m: 0 },
          h: "truthy",
        },
      },
    ]);

    const statuses = await getStatuses("user-x");
    expect(statuses).toEqual({ keep: "KNOW" });

    const study = await getStudyPreferences("user-x");
    expect(study.chunkSize).toBe(DEFAULT_CHUNK_SIZE);
    expect(study.statuses).toEqual(["UNMARKED", "DONT_KNOW", "PARTIAL"]);

    const review = await getReviewFilters("user-x");
    expect(review.groups).toHaveLength(10);
    expect(review.statuses).toEqual(["UNMARKED", "DONT_KNOW", "PARTIAL", "KNOW"]);
  });

  it("accepts numeric group ids when storing review filters", async () => {
    await setReviewFilters("user-y", {
      groups: ["2", "not-a-group"],
      statuses: ["KNOW"],
    });
    const review = await getReviewFilters("user-y");
    expect(review.groups).toEqual(["group-2"]);
    expect(review.statuses).toEqual(["KNOW"]);
  });

  it("throws repository errors when supabase operations fail", async () => {
    queueMockError("user_learning_state", "select", { message: "select failed" });
    await expect(getStatuses("user-z")).rejects.toMatchObject({
      message: "select failed",
    });

    queueMockError("user_learning_state", "upsert", { message: "upsert failed" });
    await expect(
      setStatus("user-z", "word-1", "KNOW"),
    ).rejects.toMatchObject({ message: "upsert failed" });
  });

  it("filters invalid statuses when setting study/review preferences", async () => {
    await setStudyPreferences("user-v", {
      chunkSize: 3,
      statuses: ["INVALID" as unknown as WordStatus],
    });
    const study = await getStudyPreferences("user-v");
    expect(study.statuses).toEqual(["UNMARKED", "DONT_KNOW", "PARTIAL"]);

    await setReviewFilters("user-v", {
      groups: [],
      statuses: ["BAD" as unknown as WordStatus],
    });
    const review = await getReviewFilters("user-v");
    expect(review.groups).toHaveLength(10);
    expect(review.statuses).toEqual(["UNMARKED", "DONT_KNOW", "PARTIAL", "KNOW"]);
  });
});
