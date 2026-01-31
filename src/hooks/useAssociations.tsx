import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createPrivateAssociation,
  createPublicAssociation,
  deletePrivateAssociation,
  listPrivateByWord,
  listPublicByWord,
  listSavedByWord,
  toggleLike as toggleLikeRepo,
  toggleSave as toggleSaveRepo,
} from "../repositories/associationRepo";
import {
  PrivateAssociation,
  PublicAssociationView,
} from "../domain/types";
import { useAuth } from "./useAuth";

type AssociationsContextValue = {
  publicLists: Record<string, PublicAssociationView[]>;
  savedLists: Record<string, PublicAssociationView[]>;
  privateLists: Record<string, PrivateAssociation[]>;
  loading: boolean;
  refresh: (wordId?: string) => Promise<void>;
  addPublic: (wordId: string, textHe: string) => Promise<void>;
  addPrivate: (wordId: string, textHe: string) => Promise<void>;
  toggleLike: (wordId: string, associationId: string) => Promise<void>;
  toggleSave: (wordId: string, associationId: string) => Promise<void>;
  deletePrivate: (wordId: string, associationId: string) => Promise<void>;
};

const AssociationsContext = createContext<AssociationsContextValue | undefined>(
  undefined,
);

export function AssociationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "guest";
  const [publicLists, setPublicLists] = useState<
    Record<string, PublicAssociationView[]>
  >({});
  const [savedLists, setSavedLists] = useState<
    Record<string, PublicAssociationView[]>
  >({});
  const [privateLists, setPrivateLists] = useState<
    Record<string, PrivateAssociation[]>
  >({});
  const [loading, setLoading] = useState(false);
  const trackedWordIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPublicLists({});
    setSavedLists({});
    setPrivateLists({});
    trackedWordIdsRef.current = new Set();
  }, [userId]);

  const refresh = useCallback(
    async (wordId?: string) => {
      const targets = wordId
        ? [wordId]
        : Array.from(trackedWordIdsRef.current);

      if (wordId) {
        trackedWordIdsRef.current.add(wordId);
      }

      if (!targets.length) {
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          targets.map(async (id) => {
            const [publicList, savedList, privateList] = await Promise.all([
              listPublicByWord(id, userId),
              listSavedByWord(id, userId),
              listPrivateByWord(id, userId),
            ]);
            return { id, publicList, savedList, privateList };
          }),
        );

        setPublicLists((prev) => {
          const next = { ...prev };
          results.forEach(({ id, publicList }) => {
            next[id] = publicList;
          });
          return next;
        });

        setSavedLists((prev) => {
          const next = { ...prev };
          results.forEach(({ id, savedList }) => {
            next[id] = savedList;
          });
          return next;
        });

        setPrivateLists((prev) => {
          const next = { ...prev };
          results.forEach(({ id, privateList }) => {
            next[id] = privateList;
          });
          return next;
        });
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  const addPublic = useCallback(
    async (wordId: string, textHe: string) => {
      await createPublicAssociation(wordId, textHe.trim(), userId);
      await refresh(wordId);
    },
    [refresh, userId],
  );

  const addPrivate = useCallback(
    async (wordId: string, textHe: string) => {
      await createPrivateAssociation(wordId, textHe.trim(), userId);
      await refresh(wordId);
    },
    [refresh, userId],
  );

  const toggleLike = useCallback(
    async (wordId: string, associationId: string) => {
      await toggleLikeRepo(associationId, userId);
      await refresh(wordId);
    },
    [refresh, userId],
  );

  const toggleSave = useCallback(
    async (wordId: string, associationId: string) => {
      await toggleSaveRepo(associationId, userId);
      await refresh(wordId);
    },
    [refresh, userId],
  );

  const deletePrivate = useCallback(
    async (wordId: string, associationId: string) => {
      await deletePrivateAssociation(associationId, wordId, userId);
      await refresh(wordId);
    },
    [refresh, userId],
  );

  const value = useMemo(
    () => ({
      publicLists,
      savedLists,
      privateLists,
      loading,
      refresh,
      addPublic,
      addPrivate,
      toggleLike,
      toggleSave,
      deletePrivate,
    }),
    [
      publicLists,
      savedLists,
      privateLists,
      loading,
      refresh,
      addPublic,
      addPrivate,
      toggleLike,
      toggleSave,
      deletePrivate,
    ],
  );

  return (
    <AssociationsContext.Provider value={value}>
      {children}
    </AssociationsContext.Provider>
  );
}

export function useAssociations(wordId?: string) {
  const ctx = useContext(AssociationsContext);
  if (!ctx) throw new Error("useAssociations must be used within AssociationsProvider");
  const refresh = ctx.refresh;

  useEffect(() => {
    if (wordId) {
      refresh(wordId);
    }
  }, [refresh, wordId]);

  const publicList = wordId ? ctx.publicLists[wordId] ?? [] : [];
  const savedList = wordId ? ctx.savedLists[wordId] ?? [] : [];
  const privateList = wordId ? ctx.privateLists[wordId] ?? [] : [];

  return {
    publicList,
    savedList,
    privateList,
    addPublic: ctx.addPublic,
    addPrivate: ctx.addPrivate,
    toggleLike: ctx.toggleLike,
    toggleSave: ctx.toggleSave,
    deletePrivate: ctx.deletePrivate,
    refresh: ctx.refresh,
    loading: ctx.loading,
  };
}
