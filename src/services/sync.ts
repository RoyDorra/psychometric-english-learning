import * as Network from "expo-network";
import { Association } from "../domain/types";

const REMOTE_ASSOCIATIONS_URL =
  "https://example.com/psychometric-associations.json";

export type AssociationsIndex = Record<string, Association[]>;

export async function canSync() {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch (error) {
    console.warn("network check failed", error);
    return false;
  }
}

export async function fetchAssociationsIndex(): Promise<AssociationsIndex | null> {
  try {
    const response = await fetch(REMOTE_ASSOCIATIONS_URL);
    if (!response.ok) return null;
    const payload = (await response.json()) as AssociationsIndex;
    return payload;
  } catch (error) {
    console.warn("remote associations fetch failed", error);
    return null;
  }
}
