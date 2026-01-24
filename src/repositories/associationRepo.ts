import { Association } from "../domain/types";
import { STORAGE_KEYS } from "../storage/keys";
import { getJson, setJson } from "../storage/storage";

type AssociationState = Record<string, Association[]>;
type AssociationVotesState = Record<string, Record<string, 1 | -1>>;

function sortAssociations(list: Association[]) {
  return [...list].sort(
    (a, b) =>
      b.baseScore +
      b.localDeltaScore -
      (a.baseScore + a.localDeltaScore)
  );
}

async function getState() {
  return getJson<AssociationState>(STORAGE_KEYS.ASSOCIATIONS, {});
}

async function saveState(state: AssociationState) {
  await setJson(STORAGE_KEYS.ASSOCIATIONS, state);
}

async function getVotesState() {
  return getJson<AssociationVotesState>(STORAGE_KEYS.ASSOCIATION_VOTES, {});
}

async function saveVotesState(state: AssociationVotesState) {
  await setJson(STORAGE_KEYS.ASSOCIATION_VOTES, state);
}

export async function getAssociations(wordId: string) {
  const state = await getState();
  return sortAssociations(state[wordId] ?? []);
}

export async function upsertRemoteAssociations(map: AssociationState) {
  const state = await getState();
  Object.entries(map).forEach(([wordId, remoteList]) => {
    const existing = state[wordId] ?? [];
    const locals = existing.filter((a) => a.source === "local");
    const mergedRemote = remoteList.map((remote) => {
      const previous = existing.find((a) => a.id === remote.id);
      return {
        ...remote,
        source: "remote" as const,
        localDeltaScore: previous?.localDeltaScore ?? 0,
      };
    });
    state[wordId] = sortAssociations([...mergedRemote, ...locals]);
  });
  await saveState(state);
  return state;
}

export async function addLocalAssociation(wordId: string, textHe: string) {
  const state = await getState();
  const now = new Date().toISOString();
  const newAssociation: Association = {
    id: `local-${Date.now()}`,
    wordId,
    textHe,
    baseScore: 0,
    localDeltaScore: 0,
    source: "local",
    createdAt: now,
  };
  const existing = state[wordId] ?? [];
  state[wordId] = sortAssociations([newAssociation, ...existing]);
  await saveState(state);
  return state[wordId];
}

export async function voteAssociation(
  wordId: string,
  associationId: string,
  delta: 1 | -1,
  voterId?: string
) {
  const state = await getState();
  const list = state[wordId] ?? [];
  const votesState = await getVotesState();
  const voterKey = voterId ?? "guest";
  const userVotes = votesState[voterKey] ?? {};

  if (userVotes[associationId]) {
    return sortAssociations(list);
  }

  const updated = list.map((association) =>
    association.id === associationId
      ? { ...association, localDeltaScore: (association.localDeltaScore ?? 0) + delta }
      : association
  );
  state[wordId] = sortAssociations(updated);
  await saveState(state);
  votesState[voterKey] = { ...userVotes, [associationId]: delta };
  await saveVotesState(votesState);
  return state[wordId];
}

export async function removeAssociationVote(
  wordId: string,
  associationId: string,
  voterId?: string
) {
  const state = await getState();
  const list = state[wordId] ?? [];
  const votesState = await getVotesState();
  const voterKey = voterId ?? "guest";
  const userVotes = votesState[voterKey] ?? {};
  const previous = userVotes[associationId];

  if (!previous) {
    return sortAssociations(list);
  }

  const updated = list.map((association) =>
    association.id === associationId
      ? { ...association, localDeltaScore: (association.localDeltaScore ?? 0) - previous }
      : association
  );
  const { [associationId]: _, ...rest } = userVotes;
  votesState[voterKey] = rest;
  state[wordId] = sortAssociations(updated);
  await saveState(state);
  await saveVotesState(votesState);
  return state[wordId];
}

export async function removeLocalAssociation(wordId: string, associationId: string) {
  const state = await getState();
  const existing = state[wordId] ?? [];
  const filtered = existing.filter(
    (association) =>
      association.id !== associationId || association.source !== "local"
  );
  if (filtered.length === existing.length) {
    return existing;
  }
  state[wordId] = sortAssociations(filtered);
  await saveState(state);
  return state[wordId];
}

export async function getAssociationIndex() {
  return getState();
}

export async function getUserAssociationVotes(voterId: string) {
  const state = await getVotesState();
  return state[voterId] ?? {};
}
