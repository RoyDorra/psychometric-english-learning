import {
  PrivateAssociation,
  PublicAssociation,
  PublicAssociationView,
} from "../domain/types";
import { STORAGE_KEYS } from "../storage/keys";
import { getJson, setJson } from "../storage/storage";
import { uuid } from "../utils/uuid";

type PrivateAssociationsState = Record<string, PrivateAssociation[]>;
type AssociationFlagState = Record<string, boolean>;

const sortPublic = <T extends PublicAssociation>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    if (b.likeCount !== a.likeCount) {
      return b.likeCount - a.likeCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

async function getPublicState() {
  return getJson<PublicAssociation[]>(STORAGE_KEYS.PUBLIC_ASSOCIATIONS, []);
}

async function savePublicState(state: PublicAssociation[]) {
  await setJson(STORAGE_KEYS.PUBLIC_ASSOCIATIONS, state);
}

async function getPrivateState(userId: string) {
  return getJson<PrivateAssociationsState>(
    STORAGE_KEYS.PRIVATE_ASSOCIATIONS(userId),
    {},
  );
}

async function savePrivateState(userId: string, state: PrivateAssociationsState) {
  await setJson(STORAGE_KEYS.PRIVATE_ASSOCIATIONS(userId), state);
}

async function getLikesState(userId: string) {
  return getJson<AssociationFlagState>(STORAGE_KEYS.ASSOCIATION_LIKES(userId), {});
}

async function saveLikesState(userId: string, state: AssociationFlagState) {
  await setJson(STORAGE_KEYS.ASSOCIATION_LIKES(userId), state);
}

async function getSavesState(userId: string) {
  return getJson<AssociationFlagState>(STORAGE_KEYS.ASSOCIATION_SAVES(userId), {});
}

async function saveSavesState(userId: string, state: AssociationFlagState) {
  await setJson(STORAGE_KEYS.ASSOCIATION_SAVES(userId), state);
}

export async function listPublicByWord(
  wordId: string,
  userId: string,
): Promise<PublicAssociationView[]> {
  const [allPublic, likes, saves] = await Promise.all([
    getPublicState(),
    getLikesState(userId),
    getSavesState(userId),
  ]);

  const views = allPublic
    .filter((assoc) => assoc.wordId === wordId)
    .map(
      (assoc): PublicAssociationView => ({
        ...assoc,
        isLikedByMe: Boolean(likes[assoc.id]),
        isSavedByMe: Boolean(saves[assoc.id]),
      }),
    );

  return sortPublic(views);
}

export async function listSavedByWord(
  wordId: string,
  userId: string,
): Promise<PublicAssociationView[]> {
  const [allPublic, likes, saves] = await Promise.all([
    getPublicState(),
    getLikesState(userId),
    getSavesState(userId),
  ]);

  const views = allPublic
    .filter((assoc) => assoc.wordId === wordId && saves[assoc.id])
    .map(
      (assoc): PublicAssociationView => ({
        ...assoc,
        isLikedByMe: Boolean(likes[assoc.id]),
        isSavedByMe: true,
      }),
    );

  return sortPublic(views);
}

export async function listPrivateByWord(
  wordId: string,
  userId: string,
): Promise<PrivateAssociation[]> {
  const state = await getPrivateState(userId);
  const list = state[wordId] ?? [];
  return [...list].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createPublicAssociation(
  wordId: string,
  textHe: string,
  userId: string,
): Promise<void> {
  const list = await getPublicState();
  const now = new Date().toISOString();
  const newAssociation: PublicAssociation = {
    id: uuid(),
    wordId,
    textHe,
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now,
    likeCount: 0,
  };
  await savePublicState([newAssociation, ...list]);
}

export async function createPrivateAssociation(
  wordId: string,
  textHe: string,
  userId: string,
): Promise<void> {
  const state = await getPrivateState(userId);
  const now = new Date().toISOString();
  const next: PrivateAssociation = {
    id: uuid(),
    wordId,
    textHe,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  const existing = state[wordId] ?? [];
  state[wordId] = [next, ...existing];
  await savePrivateState(userId, state);
}

export async function toggleLike(associationId: string, userId: string) {
  const [publicList, likes] = await Promise.all([
    getPublicState(),
    getLikesState(userId),
  ]);
  const isLiked = Boolean(likes[associationId]);
  const updatedLikes = { ...likes };
  if (isLiked) {
    delete updatedLikes[associationId];
  } else {
    updatedLikes[associationId] = true;
  }

  const updatedPublic = publicList.map((assoc) =>
    assoc.id === associationId
      ? {
          ...assoc,
          likeCount: Math.max(0, assoc.likeCount + (isLiked ? -1 : 1)),
          updatedAt: new Date().toISOString(),
        }
      : assoc,
  );

  await Promise.all([
    savePublicState(updatedPublic),
    saveLikesState(userId, updatedLikes),
  ]);
}

export async function toggleSave(associationId: string, userId: string) {
  const saves = await getSavesState(userId);
  const updated = { ...saves };
  if (updated[associationId]) {
    delete updated[associationId];
  } else {
    updated[associationId] = true;
  }
  await saveSavesState(userId, updated);
}

export async function deletePrivateAssociation(
  associationId: string,
  wordId: string,
  userId: string,
): Promise<void> {
  const state = await getPrivateState(userId);
  const existing = state[wordId] ?? [];
  const filtered = existing.filter((assoc) => assoc.id !== associationId);
  state[wordId] = filtered;
  await savePrivateState(userId, state);
}

export async function updatePrivateAssociation(
  associationId: string,
  wordId: string,
  userId: string,
  textHe: string,
): Promise<void> {
  const state = await getPrivateState(userId);
  const existing = state[wordId] ?? [];
  state[wordId] = existing.map((assoc) =>
    assoc.id === associationId
      ? { ...assoc, textHe, updatedAt: new Date().toISOString() }
      : assoc,
  );
  await savePrivateState(userId, state);
}
