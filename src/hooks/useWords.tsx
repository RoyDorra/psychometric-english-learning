import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_CHUNK_SIZE,
  getGroups,
  getHelpPreference,
  getReviewFilters,
  getStatuses,
  getStudyPreferences,
  getWordById,
  getWordsByGroup,
  setHelpPreference,
  setReviewFilters,
  setStatus,
  setStudyPreferences,
} from "../repositories/wordRepo";
import {
  Group,
  ReviewFilters,
  StudyPreferences,
  Word,
  WordStatus,
} from "../domain/types";
import { useAuth } from "./useAuth";
import {
  DEFAULT_REVIEW_STATUSES,
  DEFAULT_STUDY_STATUSES,
} from "../domain/status";

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

type WordContextValue = {
  statuses: Record<string, WordStatus>;
  groups: Group[];
  getWordsForGroup: (groupId: string | number) => Word[];
  getWord: (wordId: string) => Word | null;
  updateStatus: (wordId: string, status: WordStatus) => Promise<void>;
  studyPreferences: StudyPreferences;
  setStudyPreferences: (prefs: StudyPreferences) => Promise<void>;
  reviewFilters: ReviewFilters;
  setReviewFilters: (filters: ReviewFilters) => Promise<void>;
  helpSeen: boolean;
  markHelpSeen: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

const WordContext = createContext<WordContextValue | undefined>(undefined);

export function WordProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const groups = useMemo(() => getGroups(), []);
  const defaultStudyPreferences = useMemo<StudyPreferences>(
    () => ({
      chunkSize: DEFAULT_CHUNK_SIZE,
      statuses: DEFAULT_STUDY_STATUSES,
    }),
    [],
  );
  const defaultReviewFilters = useMemo<ReviewFilters>(
    () => ({
      groups: groups.map((group) => group.id),
      statuses: DEFAULT_REVIEW_STATUSES,
    }),
    [groups],
  );

  const [statuses, setStatuses] = useState<Record<string, WordStatus>>({});
  const [studyPreferences, setStudyPrefsState] =
    useState<StudyPreferences>(defaultStudyPreferences);
  const [reviewFilters, setReviewFiltersState] =
    useState<ReviewFilters>(defaultReviewFilters);
  const [helpSeen, setHelpSeen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resetLocalState = useCallback(() => {
    setStatuses({});
    setHelpSeen(false);
    setStudyPrefsState(defaultStudyPreferences);
    setReviewFiltersState(defaultReviewFilters);
  }, [defaultReviewFilters, defaultStudyPreferences]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!userId) {
        resetLocalState();
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [loadedStatuses, helpPref, studyPrefs, reviewPrefs] =
          await Promise.all([
            getStatuses(userId),
            getHelpPreference(userId),
            getStudyPreferences(userId),
            getReviewFilters(userId),
          ]);
        if (!active) return;
        setStatuses(loadedStatuses);
        setHelpSeen(helpPref.seen);
        setStudyPrefsState(studyPrefs);
        setReviewFiltersState(reviewPrefs);
      } catch (nextError) {
        if (!active) return;
        console.warn("failed loading words state", nextError);
        resetLocalState();
        setError(toErrorMessage(nextError, "שגיאה בטעינת נתוני למידה"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [resetLocalState, userId]);

  const updateStatus = useCallback(
    async (wordId: string, status: WordStatus) => {
      if (!userId) return;
      const previousStatuses = statuses;
      setError(null);
      setStatuses((prev) => {
        const next = { ...prev };
        if (status === "UNMARKED") {
          delete next[wordId];
        } else {
          next[wordId] = status;
        }
        return next;
      });
      try {
        await setStatus(userId, wordId, status);
      } catch (nextError) {
        console.warn("failed updating word status", nextError);
        setStatuses(previousStatuses);
        setError(toErrorMessage(nextError, "שמירת הסטטוס נכשלה"));
      }
    },
    [statuses, userId],
  );

  const updateStudyPreferences = useCallback(
    async (prefs: StudyPreferences) => {
      if (!userId) return;
      const previous = studyPreferences;
      setError(null);
      setStudyPrefsState(prefs);
      try {
        await setStudyPreferences(userId, prefs);
      } catch (nextError) {
        console.warn("failed updating study preferences", nextError);
        setStudyPrefsState(previous);
        setError(toErrorMessage(nextError, "שמירת הגדרות למידה נכשלה"));
      }
    },
    [studyPreferences, userId],
  );

  const updateReviewFilters = useCallback(
    async (filters: ReviewFilters) => {
      if (!userId) return;
      const previous = reviewFilters;
      setError(null);
      setReviewFiltersState(filters);
      try {
        await setReviewFilters(userId, filters);
      } catch (nextError) {
        console.warn("failed updating review filters", nextError);
        setReviewFiltersState(previous);
        setError(toErrorMessage(nextError, "שמירת סינון השינון נכשלה"));
      }
    },
    [reviewFilters, userId],
  );

  const markHelpSeen = useCallback(async () => {
    if (!userId) return;
    const previous = helpSeen;
    setError(null);
    setHelpSeen(true);
    try {
      await setHelpPreference(userId, { seen: true });
    } catch (nextError) {
      console.warn("failed updating help preference", nextError);
      setHelpSeen(previous);
      setError(toErrorMessage(nextError, "שמירת העדפת העזרה נכשלה"));
    }
  }, [helpSeen, userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      statuses,
      groups,
      getWordsForGroup: getWordsByGroup,
      getWord: getWordById,
      updateStatus,
      studyPreferences,
      setStudyPreferences: updateStudyPreferences,
      reviewFilters,
      setReviewFilters: updateReviewFilters,
      helpSeen,
      markHelpSeen,
      loading,
      error,
      clearError,
    }),
    [
      statuses,
      groups,
      studyPreferences,
      reviewFilters,
      helpSeen,
      loading,
      error,
      clearError,
      updateStatus,
      updateStudyPreferences,
      updateReviewFilters,
      markHelpSeen,
    ],
  );

  return <WordContext.Provider value={value}>{children}</WordContext.Provider>;
}

export function useWords() {
  const ctx = useContext(WordContext);
  if (!ctx) throw new Error("useWords must be used within WordProvider");
  return ctx;
}
