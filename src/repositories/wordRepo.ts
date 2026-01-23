import { DEMO_GROUPS, DEMO_WORDS } from "../data/words.demo";
import { DEFAULT_STUDY_STATUSES, DEFAULT_REVIEW_STATUSES } from "../domain/status";
import {
  Group,
  HelpPreference,
  ReviewFilters,
  StudyPreferences,
  Word,
  WordStatus,
} from "../domain/types";
import { STORAGE_KEYS } from "../storage/keys";
import { getJson, setJson } from "../storage/storage";

type StatusState = Record<string, Record<string, WordStatus>>;
type HelpState = Record<string, HelpPreference>;
type StudyState = Record<string, StudyPreferences>;
type ReviewState = Record<string, ReviewFilters>;

export const DEFAULT_CHUNK_SIZE = 7;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getGroups(): Group[] {
  return DEMO_GROUPS;
}

export function getWords(): Word[] {
  return DEMO_WORDS;
}

export function getWordsByGroup(groupId: number) {
  return DEMO_WORDS.filter((word) => word.groupId === groupId);
}

export function getWordById(wordId: string) {
  return DEMO_WORDS.find((w) => w.id === wordId) ?? null;
}

export async function getStatuses(email: string) {
  const all = await getJson<StatusState>(STORAGE_KEYS.STATUSES, {});
  return clone(all[email] ?? {});
}

export async function setStatus(
  email: string,
  wordId: string,
  status: WordStatus
) {
  const all = await getJson<StatusState>(STORAGE_KEYS.STATUSES, {});
  const existing = all[email] ?? {};
  existing[wordId] = status;
  all[email] = existing;
  await setJson(STORAGE_KEYS.STATUSES, all);
  return clone(existing);
}

export async function getHelpPreference(email: string) {
  const prefs = await getJson<HelpState>(STORAGE_KEYS.HELP, {});
  return prefs[email] ?? { seen: false };
}

export async function setHelpPreference(email: string, preference: HelpPreference) {
  const prefs = await getJson<HelpState>(STORAGE_KEYS.HELP, {});
  prefs[email] = preference;
  await setJson(STORAGE_KEYS.HELP, prefs);
  return preference;
}

export async function getStudyPreferences(email: string) {
  const prefs = await getJson<StudyState>(STORAGE_KEYS.STUDY_PREFS, {});
  return (
    prefs[email] ?? {
      chunkSize: DEFAULT_CHUNK_SIZE,
      statuses: DEFAULT_STUDY_STATUSES,
    }
  );
}

export async function setStudyPreferences(
  email: string,
  preferences: StudyPreferences
) {
  const prefs = await getJson<StudyState>(STORAGE_KEYS.STUDY_PREFS, {});
  prefs[email] = preferences;
  await setJson(STORAGE_KEYS.STUDY_PREFS, prefs);
  return preferences;
}

export async function getReviewFilters(email: string) {
  const prefs = await getJson<ReviewState>(STORAGE_KEYS.REVIEW_PREFS, {});
  return (
    prefs[email] ?? {
      groups: DEMO_GROUPS.map((g) => g.id),
      statuses: DEFAULT_REVIEW_STATUSES,
    }
  );
}

export async function setReviewFilters(
  email: string,
  filters: ReviewFilters
) {
  const prefs = await getJson<ReviewState>(STORAGE_KEYS.REVIEW_PREFS, {});
  prefs[email] = filters;
  await setJson(STORAGE_KEYS.REVIEW_PREFS, prefs);
  return filters;
}
