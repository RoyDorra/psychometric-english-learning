import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { I18nManager, Pressable, StyleSheet } from "react-native";
import {
  reviewIndex,
  studyIndex,
  studySetup,
  wordDetails,
  wordsGroup,
  wordsIndex,
} from "@/src/navigation/routes";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function HeaderBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{
    groupId?: string | string[];
    wordId?: string | string[];
  }>();
  const { getWord } = useWords();

  const wordIdFromPath =
    pathname.match(/^\/words\/word\/([^/]+?)(?:\.associations)?$/)?.[1] ?? null;
  const studyGroupIdFromPath =
    pathname.match(/^\/study\/([^/]+)\/(?:setup|pager)$/)?.[1] ?? null;
  const wordsGroupIdFromPath =
    pathname.match(/^\/words\/([^/]+)$/)?.[1] ?? null;

  const resolvedWordId =
    (Array.isArray(params.wordId) ? params.wordId[0] : params.wordId) ??
    wordIdFromPath ??
    undefined;
  const resolvedGroupId =
    (Array.isArray(params.groupId) ? params.groupId[0] : params.groupId) ??
    studyGroupIdFromPath ??
    wordsGroupIdFromPath ??
    undefined;
  const word = resolvedWordId ? getWord(resolvedWordId) : null;

  let target = null;

  if (pathname.startsWith("/words/word/")) {
    if (pathname.endsWith(".associations")) {
      target = resolvedWordId ? wordDetails(resolvedWordId) : wordsIndex();
    } else {
      target = word?.groupId ? wordsGroup(word.groupId) : wordsIndex();
    }
  } else if (pathname.startsWith("/words/")) {
    target = pathname === "/words" ? null : wordsIndex();
  } else if (pathname.startsWith("/study/")) {
    if (pathname.endsWith("/pager")) {
      target = resolvedGroupId ? studySetup(resolvedGroupId) : studyIndex();
    } else if (pathname.endsWith("/setup")) {
      target = studyIndex();
    }
  } else if (pathname === "/review/player") {
    target = reviewIndex();
  }

  if (!target) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.replace(target)}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
      hitSlop={8}
    >
      <Ionicons
        name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
        size={18}
        color={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
});
