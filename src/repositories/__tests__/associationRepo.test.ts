jest.mock("@/src/services/supabase", () => {
  const { mockSupabase } = require("@/test/supabaseInMemory");
  return { supabase: mockSupabase };
});

import {
  createPrivateAssociation,
  createPublicAssociation,
  deletePrivateAssociation,
  listPrivateByWord,
  listPublicByWord,
  listSavedByWord,
  toggleLike,
  toggleSave,
  updatePrivateAssociation,
} from "../associationRepo";
import {
  queueMockError,
  readMockTable,
  resetMockSupabase,
  writeMockTable,
} from "@/test/supabaseInMemory";

describe("associationRepo", () => {
  const wordId = "word-1";
  const otherWordId = "word-2";
  const userId = "user-1";

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00Z"));
    resetMockSupabase();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function seedPublic() {
    await createPublicAssociation(wordId, "older", userId);
    jest.setSystemTime(new Date("2024-01-01T00:00:10Z"));
    await createPublicAssociation(wordId, "newer", userId);
    jest.setSystemTime(new Date("2024-01-01T00:00:20Z"));
    await createPublicAssociation(otherWordId, "other", userId);
  }

  it("sorts public associations by likes then creation time and annotates user flags", async () => {
    await seedPublic();

    const initial = await listPublicByWord(wordId, userId);
    expect(initial.map((a) => a.textHe)).toEqual(["newer", "older"]);

    const target = initial[1];
    await toggleLike(target.id, userId);

    const afterLike = await listPublicByWord(wordId, userId);
    expect(afterLike[0].id).toBe(target.id);
    expect(afterLike[0].isLikedByMe).toBe(true);
    expect(afterLike[0].likeCount).toBe(1);
  });

  it("saves and unsaves associations per user", async () => {
    await seedPublic();
    const publicList = await listPublicByWord(wordId, userId);
    const toSave = publicList[0];

    await toggleSave(toSave.id, userId);
    let saved = await listSavedByWord(wordId, userId);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(toSave.id);
    expect(saved[0].isSavedByMe).toBe(true);
    expect(saved[0].isLikedByMe).toBe(false);

    await toggleSave(toSave.id, userId);
    saved = await listSavedByWord(wordId, userId);
    expect(saved).toHaveLength(0);
  });

  it("stores private associations per user and word, supporting updates and deletes", async () => {
    await createPrivateAssociation(wordId, "private-1", userId);
    jest.setSystemTime(new Date("2024-01-01T00:00:01Z"));
    await createPrivateAssociation(wordId, "private-2", "user-2");
    jest.setSystemTime(new Date("2024-01-01T00:00:02Z"));
    await createPrivateAssociation(wordId, "private-3", userId);

    const mine = await listPrivateByWord(wordId, userId);
    expect(mine.map((a) => a.textHe)).toEqual(["private-3", "private-1"]);

    await updatePrivateAssociation(mine[0].id, wordId, userId, "updated");
    const updated = await listPrivateByWord(wordId, userId);
    expect(updated[0].textHe).toBe("updated");

    await deletePrivateAssociation(updated[0].id, wordId, userId);
    const afterDelete = await listPrivateByWord(wordId, userId);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].textHe).toBe("private-1");
  });

  it("persists data to public_associations table", async () => {
    await createPublicAssociation(wordId, "persisted", userId);
    const stored = readMockTable<{ text_he: string; word_id: string }>(
      "public_associations",
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].text_he).toBe("persisted");
  });

  it("keeps ordering stable with likes and timestamps", async () => {
    await seedPublic();
    const [first, second] = await listPublicByWord(wordId, userId);
    expect([first.textHe, second.textHe]).toEqual(["newer", "older"]);

    await toggleLike(first.id, userId);
    const liked = await listPublicByWord(wordId, userId);
    expect(liked[0].id).toBe(first.id);

    await toggleLike(first.id, userId);
    const unliked = await listPublicByWord(wordId, userId);
    expect(unliked[0].textHe).toBe("newer");
  });

  it("ignores saves for other users and does not duplicate", async () => {
    await seedPublic();
    const [first] = await listPublicByWord(wordId, userId);

    await toggleSave(first.id, "other-user");
    let savedForOther = await listSavedByWord(wordId, "other-user");
    expect(savedForOther).toHaveLength(1);

    await toggleSave(first.id, "other-user");
    savedForOther = await listSavedByWord(wordId, "other-user");
    expect(savedForOther).toHaveLength(0);
  });

  it("private deletion does not impact public associations", async () => {
    await seedPublic();
    await createPrivateAssociation(wordId, "private-only", userId);
    const before = await listPublicByWord(wordId, userId);

    const privates = await listPrivateByWord(wordId, userId);
    await deletePrivateAssociation(privates[0].id, wordId, userId);

    const after = await listPublicByWord(wordId, userId);
    expect(after.length).toBe(before.length);
  });

  it("normalizes association text before write", async () => {
    await createPublicAssociation(wordId, "  spaced   text  ", userId);
    const list = await listPublicByWord(wordId, userId);
    expect(list[0].textHe).toBe("spaced text");
  });

  it("returns empty public/saved/private lists when no rows exist", async () => {
    const publicList = await listPublicByWord(wordId, userId);
    const savedList = await listSavedByWord(wordId, userId);
    const privateList = await listPrivateByWord(wordId, userId);

    expect(publicList).toEqual([]);
    expect(savedList).toEqual([]);
    expect(privateList).toEqual([]);
  });

  it("throws when insert/update text normalizes to empty", async () => {
    await expect(
      createPublicAssociation(wordId, "   ", userId),
    ).rejects.toThrow("Association text cannot be empty");

    await expect(
      createPrivateAssociation(wordId, "\n\t", userId),
    ).rejects.toThrow("Association text cannot be empty");

    await createPrivateAssociation(wordId, "seed", userId);
    const [row] = await listPrivateByWord(wordId, userId);
    await expect(
      updatePrivateAssociation(row.id, wordId, userId, "   "),
    ).rejects.toThrow("Association text cannot be empty");
  });

  it("propagates backend errors for read and write operations", async () => {
    queueMockError("public_associations", "select", { message: "select failed" });
    await expect(listPublicByWord(wordId, userId)).rejects.toMatchObject({
      message: "select failed",
    });

    queueMockError("public_associations", "insert", { message: "insert failed" });
    await expect(
      createPublicAssociation(wordId, "valid", userId),
    ).rejects.toMatchObject({ message: "insert failed" });

    queueMockError("private_associations", "update", { message: "update failed" });
    await createPrivateAssociation(wordId, "seed", userId);
    const [row] = await listPrivateByWord(wordId, userId);
    await expect(
      updatePrivateAssociation(row.id, wordId, userId, "next"),
    ).rejects.toMatchObject({ message: "update failed" });
  });

  it("throws non-unique errors during like/save toggle", async () => {
    await createPublicAssociation(wordId, "seed", userId);
    const [assoc] = await listPublicByWord(wordId, userId);

    queueMockError("public_association_likes", "insert", {
      code: "40000",
      message: "likes insert failed",
    });
    await expect(toggleLike(assoc.id, userId)).rejects.toMatchObject({
      message: "likes insert failed",
    });

    queueMockError("public_association_saves", "insert", {
      code: "40000",
      message: "saves insert failed",
    });
    await expect(toggleSave(assoc.id, userId)).rejects.toMatchObject({
      message: "saves insert failed",
    });
  });

  it("throws when delete operations fail", async () => {
    await createPublicAssociation(wordId, "seed", userId);
    const [assoc] = await listPublicByWord(wordId, userId);
    await toggleLike(assoc.id, userId);
    await toggleSave(assoc.id, userId);
    await createPrivateAssociation(wordId, "private", userId);
    const [privateAssoc] = await listPrivateByWord(wordId, userId);

    queueMockError("public_association_likes", "delete", {
      message: "likes delete failed",
    });
    await expect(toggleLike(assoc.id, userId)).rejects.toMatchObject({
      message: "likes delete failed",
    });

    queueMockError("public_association_saves", "delete", {
      message: "saves delete failed",
    });
    await expect(toggleSave(assoc.id, userId)).rejects.toMatchObject({
      message: "saves delete failed",
    });

    queueMockError("private_associations", "delete", {
      message: "private delete failed",
    });
    await expect(
      deletePrivateAssociation(privateAssoc.id, wordId, userId),
    ).rejects.toMatchObject({ message: "private delete failed" });
  });

  it("marks liked/saved flags only for the requesting user", async () => {
    await createPublicAssociation(wordId, "seed", userId);
    const [assoc] = await listPublicByWord(wordId, userId);
    await toggleLike(assoc.id, "other-user");
    await toggleSave(assoc.id, "other-user");

    const mine = await listPublicByWord(wordId, userId);
    expect(mine[0].isLikedByMe).toBe(false);
    expect(mine[0].isSavedByMe).toBe(false);

    const theirs = await listPublicByWord(wordId, "other-user");
    expect(theirs[0].isLikedByMe).toBe(true);
    expect(theirs[0].isSavedByMe).toBe(true);
  });

  it("handles missing likes/saves rows by returning false flags", async () => {
    await createPublicAssociation(wordId, "seed", userId);
    const rows = readMockTable<{ id: string; word_id: string }>(
      "public_associations",
    );
    writeMockTable("public_association_likes", [
      { association_id: rows[0].id, user_id: "other-user", created_at: new Date().toISOString() },
    ]);
    writeMockTable("public_association_saves", [
      { association_id: rows[0].id, user_id: "other-user", created_at: new Date().toISOString() },
    ]);

    const list = await listPublicByWord(wordId, userId);
    expect(list[0].isLikedByMe).toBe(false);
    expect(list[0].isSavedByMe).toBe(false);
  });
});
