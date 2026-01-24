import { I18nManager, Platform } from "react-native";

let initialized = false;

export function ensureRTL() {
  if (initialized) return;
  initialized = true;
  try {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.dir = "rtl";
    }
  } catch (error) {
    console.warn("failed forcing RTL", error);
  }
}
