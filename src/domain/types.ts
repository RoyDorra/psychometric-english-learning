export type WordStatus = "UNMARKED" | "DONT_KNOW" | "PARTIAL" | "KNOW";

export type Word = {
  id: string;
  en: string;
  he: readonly string[];
  group: number;
  index: number;
};

export type Group = {
  id: string;
  name: string;
  order: number;
};

export type PublicAssociation = {
  id: string;
  wordId: string;
  textHe: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
};

export type PrivateAssociation = {
  id: string;
  wordId: string;
  textHe: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type AssociationMeta = {
  isLikedByMe: boolean;
  isSavedByMe: boolean;
};

export type PublicAssociationView = PublicAssociation & AssociationMeta;

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type Session = {
  user: {
    id: string;
    email?: string;
  };
  token: string;
};

export type StudyPreferences = {
  chunkSize: number;
  statuses: WordStatus[];
};

export type ReviewFilters = {
  groups: string[];
  statuses: WordStatus[];
};

export type HelpPreference = {
  seen: boolean;
};
