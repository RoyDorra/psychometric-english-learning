import { PrivateAssociation, PublicAssociationView, Word } from "@/src/domain/types";

let idCounter = 0;
const nextId = () => `test-${++idCounter}`;

export function wordFactory(overrides: Partial<Word> = {}): Word {
  return {
    id: overrides.id ?? nextId(),
    en: overrides.en ?? "anchor",
    he: overrides.he ?? ["עוגן"],
    group: overrides.group ?? 1,
    index: overrides.index ?? 0,
  };
}

export function publicAssociationFactory(
  overrides: Partial<PublicAssociationView> = {},
): PublicAssociationView {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? nextId(),
    wordId: overrides.wordId ?? "word-1",
    textHe: overrides.textHe ?? "אסוציאציה",
    createdByUserId: overrides.createdByUserId ?? "user-1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    likeCount: overrides.likeCount ?? 0,
    isLikedByMe: overrides.isLikedByMe ?? false,
    isSavedByMe: overrides.isSavedByMe ?? false,
    ...overrides,
  };
}

export function privateAssociationFactory(
  overrides: Partial<PrivateAssociation> = {},
): PrivateAssociation {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? nextId(),
    wordId: overrides.wordId ?? "word-1",
    textHe: overrides.textHe ?? "ביתי",
    userId: overrides.userId ?? "user-1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  };
}
