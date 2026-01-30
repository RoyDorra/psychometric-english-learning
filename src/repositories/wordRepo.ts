import { GROUPS, WORDS, WORD_BY_ID } from "../data/words";
import {
  DEFAULT_STUDY_STATUSES,
  DEFAULT_REVIEW_STATUSES,
} from "../domain/status";
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

const GROUP_ID_TO_NUMBER = new Map(
  GROUPS.map((group) => [group.id, group.order]),
);

function resolveGroupNumber(groupId: string | number) {
  if (typeof groupId === "number") return groupId;
  const fromId = GROUP_ID_TO_NUMBER.get(groupId);
  if (fromId) return fromId;
  const parsed = Number(groupId);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getGroups(): Group[] {
  return GROUPS;
}

export function getWords(): Word[] {
  return WORDS;
}

export function getWordsByGroup(groupId: string | number) {
  const groupNumber = resolveGroupNumber(groupId);
  if (!groupNumber) return [];
  return WORDS.filter((word) => word.group === groupNumber);
}

export function getWordById(wordId: string) {
  return WORD_BY_ID.get(wordId) ?? null;
}

export async function getStatuses(email: string) {
  const all = await getJson<StatusState>(STORAGE_KEYS.STATUSES, {});
  return clone(all[email] ?? {});
}

export async function setStatus(
  email: string,
  wordId: string,
  status: WordStatus,
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

export async function setHelpPreference(
  email: string,
  preference: HelpPreference,
) {
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
  preferences: StudyPreferences,
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
      groups: GROUPS.map((g) => g.id),
      statuses: DEFAULT_REVIEW_STATUSES,
    }
  );
}

export async function setReviewFilters(email: string, filters: ReviewFilters) {
  const prefs = await getJson<ReviewState>(STORAGE_KEYS.REVIEW_PREFS, {});
  prefs[email] = filters;
  await setJson(STORAGE_KEYS.REVIEW_PREFS, prefs);
  return filters;
}
