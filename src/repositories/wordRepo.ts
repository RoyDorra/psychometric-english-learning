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

type StatusEntry = Record<string, WordStatus>;

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

export async function getStatuses(userId: string) {
  const statuses = await getJson<StatusEntry>(STORAGE_KEYS.STATUSES(userId), {});
  return clone(statuses);
}

export async function setStatus(
  userId: string,
  wordId: string,
  status: WordStatus,
) {
  const key = STORAGE_KEYS.STATUSES(userId);
  const existing = await getJson<StatusEntry>(key, {});
  existing[wordId] = status;
  await setJson(key, existing);
  return clone(existing);
}

export async function getHelpPreference(userId: string) {
  return getJson<HelpPreference>(STORAGE_KEYS.HELP(userId), { seen: false });
}

export async function setHelpPreference(
  userId: string,
  preference: HelpPreference,
) {
  await setJson(STORAGE_KEYS.HELP(userId), preference);
  return preference;
}

export async function getStudyPreferences(userId: string) {
  const fallback: StudyPreferences = {
    chunkSize: DEFAULT_CHUNK_SIZE,
    statuses: DEFAULT_STUDY_STATUSES,
  };
  return getJson<StudyPreferences>(STORAGE_KEYS.STUDY_PREFS(userId), fallback);
}

export async function setStudyPreferences(
  userId: string,
  preferences: StudyPreferences,
) {
  await setJson(STORAGE_KEYS.STUDY_PREFS(userId), preferences);
  return preferences;
}

export async function getReviewFilters(userId: string) {
  const fallback: ReviewFilters = {
    groups: GROUPS.map((g) => g.id),
    statuses: DEFAULT_REVIEW_STATUSES,
  };
  return getJson<ReviewFilters>(STORAGE_KEYS.REVIEW_PREFS(userId), fallback);
}

export async function setReviewFilters(userId: string, filters: ReviewFilters) {
  await setJson(STORAGE_KEYS.REVIEW_PREFS(userId), filters);
  return filters;
}
