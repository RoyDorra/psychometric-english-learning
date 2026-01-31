import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  addLocalAssociation,
  getAssociationIndex,
  getUserAssociationVotes,
  removeAssociationVote,
  removeLocalAssociation,
  voteAssociation,
} from "../repositories/associationRepo";
import { Association } from "../domain/types";
import { syncAssociationsIfPossible } from "../core/bootstrap";
import { useAuth } from "./useAuth";

type AssociationsContextValue = {
  associations: Record<string, Association[]>;
  votes: Record<string, 1 | -1>;
  refresh: () => Promise<void>;
  add: (wordId: string, text: string) => Promise<Association[]>;
  vote: (wordId: string, associationId: string, delta: 1 | -1) => Promise<Association[]>;
  unvote: (wordId: string, associationId: string) => Promise<Association[]>;
  remove: (wordId: string, associationId: string) => Promise<Association[]>;
  hasVoted: (associationId: string) => boolean;
  syncing: boolean;
};

const AssociationsContext = createContext<AssociationsContextValue | undefined>(undefined);

export function AssociationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [associations, setAssociations] = useState<Record<string, Association[]>>({});
  const [votes, setVotes] = useState<Record<string, 1 | -1>>({});
  const [syncing, setSyncing] = useState(false);
  const userId = session?.user.id ?? "guest";

  const load = useCallback(async () => {
    const map = await getAssociationIndex();
    setAssociations(map);
  }, []);

  const loadVotes = useCallback(async () => {
    const map = await getUserAssociationVotes(userId);
    setVotes(map);
  }, [userId]);

  const refresh = useCallback(async () => {
    setSyncing(true);
    await syncAssociationsIfPossible();
    await load();
    await loadVotes();
    setSyncing(false);
  }, [load, loadVotes]);

  useEffect(() => {
    load();
    loadVotes();
  }, [load, loadVotes]);

  useEffect(() => {
    if (session) {
      refresh();
    }
  }, [session, refresh]);

  const add = useCallback(async (wordId: string, text: string) => {
    const list = await addLocalAssociation(wordId, text.trim());
    setAssociations((prev) => ({ ...prev, [wordId]: list }));
    return list;
  }, []);

  const vote = useCallback(async (wordId: string, associationId: string, delta: 1 | -1) => {
    if (votes[associationId]) {
      return associations[wordId] ?? [];
    }
    const list = await voteAssociation(wordId, associationId, delta, userId);
    setAssociations((prev) => ({ ...prev, [wordId]: list }));
    setVotes((prev) => ({ ...prev, [associationId]: delta }));
    return list;
  }, [associations, votes, userId]);

  const unvote = useCallback(async (wordId: string, associationId: string) => {
    if (!votes[associationId]) {
      return associations[wordId] ?? [];
    }
    const list = await removeAssociationVote(wordId, associationId, userId);
    setAssociations((prev) => ({ ...prev, [wordId]: list }));
    setVotes((prev) => {
      const { [associationId]: _, ...rest } = prev;
      return rest;
    });
    return list;
  }, [associations, votes, userId]);

  const remove = useCallback(async (wordId: string, associationId: string) => {
    const list = await removeLocalAssociation(wordId, associationId);
    setAssociations((prev) => ({ ...prev, [wordId]: list }));
    return list;
  }, []);

  const hasVoted = useCallback(
    (associationId: string) => Boolean(votes[associationId]),
    [votes]
  );

  const value = useMemo(
    () => ({
      associations,
      votes,
      refresh,
      add,
      vote,
      unvote,
      remove,
      hasVoted,
      syncing,
    }),
    [associations, votes, syncing, refresh, add, vote, unvote, remove, hasVoted]
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
  const list = wordId ? ctx.associations[wordId] ?? [] : [];
  return {
    ...ctx,
    list,
  };
}
