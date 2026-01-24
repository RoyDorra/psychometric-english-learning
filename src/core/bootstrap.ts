import { STORAGE_KEYS } from "../storage/keys";
import { getJson, setJson } from "../storage/storage";
import { ensureRTL } from "../ui/rtl";
import { canSync, fetchAssociationsIndex } from "../services/sync";
import { upsertRemoteAssociations } from "../repositories/associationRepo";

export async function bootstrap() {
  ensureRTL();
}

export async function syncAssociationsIfPossible() {
  const connected = await canSync();
  if (!connected) return false;
  const remote = await fetchAssociationsIndex();
  if (!remote) return false;
  await upsertRemoteAssociations(remote);
  await setJson(STORAGE_KEYS.LAST_SYNC, { lastSyncAt: new Date().toISOString() });
  return true;
}

export async function getLastSync() {
  return getJson<{ lastSyncAt?: string }>(STORAGE_KEYS.LAST_SYNC, {});
}
