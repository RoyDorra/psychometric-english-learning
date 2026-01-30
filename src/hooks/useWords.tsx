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
};

const WordContext = createContext<WordContextValue | undefined>(undefined);

export function WordProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const email = session?.email;
  const groups = useMemo(() => getGroups(), []);

  const [statuses, setStatuses] = useState<Record<string, WordStatus>>({});
  const [studyPreferences, setStudyPrefsState] = useState<StudyPreferences>({
    chunkSize: DEFAULT_CHUNK_SIZE,
    statuses: DEFAULT_STUDY_STATUSES,
  });
  const [reviewFilters, setReviewFiltersState] = useState<ReviewFilters>({
    groups: getGroups().map((g) => g.id),
    statuses: DEFAULT_REVIEW_STATUSES,
  });
  const [helpSeen, setHelpSeen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!email) {
        setStatuses({});
        setHelpSeen(false);
        setStudyPrefsState({
          chunkSize: DEFAULT_CHUNK_SIZE,
          statuses: DEFAULT_STUDY_STATUSES,
        });
        setReviewFiltersState({
          groups: getGroups().map((g) => g.id),
          statuses: DEFAULT_REVIEW_STATUSES,
        });
        setLoading(false);
        return;
      }
      setLoading(true);
      const [loadedStatuses, helpPref, studyPrefs, reviewPrefs] =
        await Promise.all([
          getStatuses(email),
          getHelpPreference(email),
          getStudyPreferences(email),
          getReviewFilters(email),
        ]);
      if (!active) return;
      setStatuses(loadedStatuses);
      setHelpSeen(helpPref.seen);
      setStudyPrefsState(studyPrefs);
      setReviewFiltersState(reviewPrefs);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [email]);

  const updateStatus = useCallback(
    async (wordId: string, status: WordStatus) => {
      if (!email) return;
      setStatuses((prev) => ({ ...prev, [wordId]: status }));
      await setStatus(email, wordId, status);
    },
    [email],
  );

  const updateStudyPreferences = useCallback(
    async (prefs: StudyPreferences) => {
      if (!email) return;
      setStudyPrefsState(prefs);
      await setStudyPreferences(email, prefs);
    },
    [email],
  );

  const updateReviewFilters = useCallback(
    async (filters: ReviewFilters) => {
      if (!email) return;
      setReviewFiltersState(filters);
      await setReviewFilters(email, filters);
    },
    [email],
  );

  const markHelpSeen = useCallback(async () => {
    if (!email) return;
    setHelpSeen(true);
    await setHelpPreference(email, { seen: true });
  }, [email]);

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
    }),
    [
      statuses,
      groups,
      studyPreferences,
      reviewFilters,
      helpSeen,
      loading,
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
