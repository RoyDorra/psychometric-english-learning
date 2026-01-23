import { I18nManager, Platform } from "react-native";

export const isRTL = true;
export const rowDirection = "row-reverse";
export const alignSelfStart = "flex-end";
export const alignSelfEnd = "flex-start";

export const rtlLayout = { direction: "rtl" as const, writingDirection: "rtl" as const };
export const ltrLayout = { direction: "ltr" as const, writingDirection: "ltr" as const };
export const rtlTextBase = { writingDirection: "rtl" as const, textAlign: "right" as const };
export const ltrTextBase = { writingDirection: "ltr" as const, textAlign: "left" as const };

let initialized = false;

export function ensureRTL() {
  if (initialized && I18nManager.isRTL) return;
  initialized = true;
  try {
    I18nManager.allowRTL(true);
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
    I18nManager.swapLeftAndRightInRTL(false);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("dir", "rtl");
      root.setAttribute("lang", root.getAttribute("lang") || "he");
      document.body?.setAttribute("dir", "rtl");
    }
  } catch (error) {
    console.warn("failed forcing RTL", error);
  }
}
