import { GROUPS, WORDS, WORD_BY_ID } from "../data/words";
import {
  DEFAULT_REVIEW_STATUSES,
  DEFAULT_STUDY_STATUSES,
  STATUS_ORDER,
} from "../domain/status";
import {
  Group,
  HelpPreference,
  ReviewFilters,
  StudyPreferences,
  Word,
  WordStatus,
} from "../domain/types";
import { supabase } from "../services/supabase";

type StatusEntry = Record<string, WordStatus>;

type LearningState = {
  v: number;
  s: StatusEntry;
  sp: {
    c: number;
    m: number;
  };
  rf: {
    g: number;
    m: number;
  };
  h: boolean;
};

const STATUS_BITS: Record<WordStatus, number> = {
  UNMARKED: 1,
  DONT_KNOW: 2,
  PARTIAL: 4,
  KNOW: 8,
};

const VALID_STATUSES = new Set<WordStatus>([
  "UNMARKED",
  "DONT_KNOW",
  "PARTIAL",
  "KNOW",
]);

const GROUP_ID_TO_NUMBER = new Map(
  GROUPS.map((group) => [group.id, group.order]),
);

const GROUP_NUMBER_TO_ID = new Map(
  GROUPS.map((group) => [group.order, group.id]),
);

const ALL_GROUP_MASK = GROUPS.reduce(
  (mask, group) => mask | (1 << (group.order - 1)),
  0,
);

const DEFAULT_STUDY_MASK = statusesToMask(DEFAULT_STUDY_STATUSES);
const DEFAULT_REVIEW_MASK = statusesToMask(DEFAULT_REVIEW_STATUSES);

const DEFAULT_CHUNK_SIZE = 7;

const DEFAULT_STATE: LearningState = {
  v: 1,
  s: {},
  sp: {
    c: DEFAULT_CHUNK_SIZE,
    m: DEFAULT_STUDY_MASK,
  },
  rf: {
    g: ALL_GROUP_MASK,
    m: DEFAULT_REVIEW_MASK,
  },
  h: false,
};

function isWordStatus(value: unknown): value is WordStatus {
  return typeof value === "string" && VALID_STATUSES.has(value as WordStatus);
}

function statusesToMask(statuses: WordStatus[]): number {
  return statuses.reduce((mask, status) => mask | STATUS_BITS[status], 0);
}

function maskToStatuses(mask: number, fallback: WordStatus[]): WordStatus[] {
  const statuses = STATUS_ORDER.filter((status) => (mask & STATUS_BITS[status]) !== 0);
  return statuses.length ? statuses : fallback;
}

function normalizeStatusMap(raw: unknown): StatusEntry {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const next: StatusEntry = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isWordStatus(value)) {
      continue;
    }
    if (value === "UNMARKED") {
      continue;
    }
    next[key] = value;
  }

  return next;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.trunc(parsed);
  return rounded > 0 ? rounded : fallback;
}

function normalizeMask(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.trunc(parsed);
  return rounded > 0 ? rounded : fallback;
}

function normalizeGroupMask(value: unknown): number {
  const mask = normalizeMask(value, ALL_GROUP_MASK);
  const validMask = mask & ALL_GROUP_MASK;
  return validMask > 0 ? validMask : ALL_GROUP_MASK;
}

function normalizeLearningState(raw: unknown): LearningState {
  const state = raw && typeof raw === "object"
    ? (raw as Partial<LearningState>)
    : ({} as Partial<LearningState>);

  const study = state.sp && typeof state.sp === "object" ? state.sp : {};
  const review = state.rf && typeof state.rf === "object" ? state.rf : {};

  return {
    v: 1,
    s: normalizeStatusMap(state.s),
    sp: {
      c: normalizePositiveInteger((study as { c?: unknown }).c, DEFAULT_CHUNK_SIZE),
      m: normalizeMask((study as { m?: unknown }).m, DEFAULT_STUDY_MASK),
    },
    rf: {
      g: normalizeGroupMask((review as { g?: unknown }).g),
      m: normalizeMask((review as { m?: unknown }).m, DEFAULT_REVIEW_MASK),
    },
    h: Boolean(state.h),
  };
}

async function getLearningState(userId: string): Promise<LearningState> {
  const { data, error } = await supabase
    .from("user_learning_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.state) {
    return { ...DEFAULT_STATE, s: {} };
  }

  return normalizeLearningState(data.state);
}

async function saveLearningState(userId: string, state: LearningState): Promise<LearningState> {
  const normalized = normalizeLearningState(state);
  const { error } = await supabase.from("user_learning_state").upsert(
    {
      user_id: userId,
      state: normalized,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw error;
  }

  return normalized;
}

function groupMaskToIds(mask: number): string[] {
  const groups = GROUPS.filter((group) => (mask & (1 << (group.order - 1))) !== 0).map(
    (group) => group.id,
  );
  return groups.length ? groups : GROUPS.map((group) => group.id);
}

function groupsToMask(groups: string[]): number {
  let mask = 0;

  for (const groupId of groups) {
    const mappedOrder = GROUP_ID_TO_NUMBER.get(groupId);
    if (typeof mappedOrder === "number") {
      mask |= 1 << (mappedOrder - 1);
      continue;
    }

    const parsed = Number(groupId);
    if (!Number.isFinite(parsed)) {
      continue;
    }

    const rounded = Math.trunc(parsed);
    if (GROUP_NUMBER_TO_ID.has(rounded)) {
      mask |= 1 << (rounded - 1);
    }
  }

  return mask > 0 ? mask : ALL_GROUP_MASK;
}

function resolveGroupNumber(groupId: string | number) {
  if (typeof groupId === "number") return groupId;
  const fromId = GROUP_ID_TO_NUMBER.get(groupId);
  if (fromId) return fromId;
  const parsed = Number(groupId);
  return Number.isFinite(parsed) ? parsed : null;
}

export { DEFAULT_CHUNK_SIZE };

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
  const state = await getLearningState(userId);
  return { ...state.s };
}

export async function setStatus(
  userId: string,
  wordId: string,
  status: WordStatus,
) {
  const state = await getLearningState(userId);
  const nextStatuses = { ...state.s };

  if (status === "UNMARKED") {
    delete nextStatuses[wordId];
  } else {
    nextStatuses[wordId] = status;
  }

  const saved = await saveLearningState(userId, {
    ...state,
    s: nextStatuses,
  });

  return { ...saved.s };
}

export async function getHelpPreference(userId: string) {
  const state = await getLearningState(userId);
  return { seen: state.h } satisfies HelpPreference;
}

export async function setHelpPreference(
  userId: string,
  preference: HelpPreference,
) {
  const state = await getLearningState(userId);
  await saveLearningState(userId, {
    ...state,
    h: Boolean(preference.seen),
  });
  return preference;
}

export async function getStudyPreferences(userId: string) {
  const state = await getLearningState(userId);
  return {
    chunkSize: normalizePositiveInteger(state.sp.c, DEFAULT_CHUNK_SIZE),
    statuses: maskToStatuses(state.sp.m, DEFAULT_STUDY_STATUSES),
  } satisfies StudyPreferences;
}

export async function setStudyPreferences(
  userId: string,
  preferences: StudyPreferences,
) {
  const state = await getLearningState(userId);
  const safeStatuses = preferences.statuses.filter((status) => isWordStatus(status));
  const nextStatuses = safeStatuses.length ? safeStatuses : DEFAULT_STUDY_STATUSES;

  const saved = await saveLearningState(userId, {
    ...state,
    sp: {
      c: normalizePositiveInteger(preferences.chunkSize, DEFAULT_CHUNK_SIZE),
      m: statusesToMask(nextStatuses),
    },
  });

  return {
    chunkSize: saved.sp.c,
    statuses: maskToStatuses(saved.sp.m, DEFAULT_STUDY_STATUSES),
  } satisfies StudyPreferences;
}

export async function getReviewFilters(userId: string) {
  const state = await getLearningState(userId);
  return {
    groups: groupMaskToIds(state.rf.g),
    statuses: maskToStatuses(state.rf.m, DEFAULT_REVIEW_STATUSES),
  } satisfies ReviewFilters;
}

export async function setReviewFilters(userId: string, filters: ReviewFilters) {
  const state = await getLearningState(userId);
  const safeStatuses = filters.statuses.filter((status) => isWordStatus(status));
  const statuses = safeStatuses.length ? safeStatuses : DEFAULT_REVIEW_STATUSES;

  const saved = await saveLearningState(userId, {
    ...state,
    rf: {
      g: groupsToMask(filters.groups),
      m: statusesToMask(statuses),
    },
  });

  return {
    groups: groupMaskToIds(saved.rf.g),
    statuses: maskToStatuses(saved.rf.m, DEFAULT_REVIEW_STATUSES),
  } satisfies ReviewFilters;
}
