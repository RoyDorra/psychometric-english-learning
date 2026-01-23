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
  voteAssociation,
} from "../repositories/associationRepo";
import { Association } from "../domain/types";
import { syncAssociationsIfPossible } from "../core/bootstrap";
import { useAuth } from "./useAuth";

type AssociationsContextValue = {
  associations: Record<string, Association[]>;
  refresh: () => Promise<void>;
  add: (wordId: string, text: string) => Promise<Association[]>;
  vote: (wordId: string, associationId: string, delta: 1 | -1) => Promise<Association[]>;
  syncing: boolean;
};

const AssociationsContext = createContext<AssociationsContextValue | undefined>(undefined);

export function AssociationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [associations, setAssociations] = useState<Record<string, Association[]>>({});
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const map = await getAssociationIndex();
    setAssociations(map);
  }, []);

  const refresh = useCallback(async () => {
    setSyncing(true);
    await syncAssociationsIfPossible();
    await load();
    setSyncing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

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
    const list = await voteAssociation(wordId, associationId, delta);
    setAssociations((prev) => ({ ...prev, [wordId]: list }));
    return list;
  }, []);

  const value = useMemo(
    () => ({
      associations,
      refresh,
      add,
      vote,
      syncing,
    }),
    [associations, syncing, refresh, add, vote]
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
