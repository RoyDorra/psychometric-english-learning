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

export type AssociationSource = "remote" | "local";

export type Association = {
  id: string;
  wordId: string;
  textHe: string;
  baseScore: number;
  localDeltaScore: number;
  source: AssociationSource;
  createdAt: string;
};

export type User = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type Session = {
  email: string;
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
