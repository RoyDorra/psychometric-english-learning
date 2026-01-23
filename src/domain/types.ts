export type WordStatus = "UNMARKED" | "DONT_KNOW" | "PARTIAL" | "KNOW";

export type Word = {
  id: string;
  groupId: number;
  english: string;
  hebrewTranslations: string[];
};

export type Group = {
  id: number;
  name: string;
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
  groups: number[];
  statuses: WordStatus[];
};

export type HelpPreference = {
  seen: boolean;
};
