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
import { STORAGE_KEYS } from "@/src/storage/keys";
import { createFakeStorage, installFakeStorage } from "@/test/fakeStorage";
import type { FakeStorage } from "@/test/fakeStorage";

describe("associationRepo", () => {
  const wordId = "word-1";
  const otherWordId = "word-2";
  const userId = "user-1";
  let fakeStorage: FakeStorage;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00Z"));
    fakeStorage = installFakeStorage(createFakeStorage());
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
    await createPrivateAssociation(wordId, "private-2", "user-2");
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

  it("persists data using storage helpers", async () => {
    await createPublicAssociation(wordId, "persisted", userId);
    const stored = await fakeStorage.getJson<
      { textHe: string; wordId: string }[]
    >(STORAGE_KEYS.PUBLIC_ASSOCIATIONS, []);
    expect(stored).toHaveLength(1);
    expect(stored[0].textHe).toBe("persisted");
  });

  it("keeps ordering stable with likes and timestamps", async () => {
    await seedPublic();
    const [first, second] = await listPublicByWord(wordId, userId);
    expect([first.textHe, second.textHe]).toEqual(["newer", "older"]);

    await toggleLike(first.id, userId); // new like should keep first on top
    const liked = await listPublicByWord(wordId, userId);
    expect(liked[0].id).toBe(first.id);

    await toggleLike(first.id, userId); // unlike returns to original order
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

  it("stores trimmed text when caller provides spaced input", async () => {
    await createPublicAssociation(wordId, "  spaced  ", userId);
    const list = await listPublicByWord(wordId, userId);
    expect(list[0].textHe.trim()).toBe("spaced");
  });
});
