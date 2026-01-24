import { Animated, Easing, StyleSheet, TouchableOpacity, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import AppText from "./AppText";
import EnglishText from "./EnglishText";
import { colors, radius, spacing } from "@/src/ui/theme";

type Props = {
  known: number;
  total: number;
};

type Species = "dog" | "cat";

const dogStages = ["🐶", "🐶", "🐶", "🐶", "🐕", "🐕", "🐕‍🦺", "🐕‍🦺", "🦮", "🦮"];
const catStages = ["🐱", "🐱", "🐱", "🐈", "🐈", "🐈‍⬛", "🐈‍⬛", "🐈‍⬛", "🐆", "🦁"];

function getBuddy(stage: number, species: Species) {
  const emoji = (species === "dog" ? dogStages : catStages)[stage] ?? "🌱";
  const titles = [
    "נבט קטן",
    "צעדים ראשונים",
    "פותחים עיניים",
    "סקרן ומקשיב",
    "רץ קדימה",
    "חבר טוב ללמידה",
    "חיית מילים",
    "כוכב המבחן",
    "מדריך הלהקה",
    "אגדה חיה",
  ];
  const tips = [
    "סווגו עוד מילים כדי לראות אותו גדל",
    "עוד כמה מילים ירוקות והוא יגדל!",
    "יפה! המשיכו בירוק כדי לצמוח",
    "אתם מתקדמים יפה, המשיכו לסמן ידע",
    "בכל 10 מילים ירוקות מחכה הפתעה",
    "חיזרו מדי יום לחזק את החבר שלכם",
    "עוד קצת והחבר הופך לחיית מילים",
    "שימרו על רצף יומי להאכיל אותו",
    "החבר שלכם גאה בכם!",
    "מדהים! המשיכו לשמור עליו מאושר",
  ];
  return {
    emoji,
    title: titles[stage] ?? titles[0],
    tip: tips[stage] ?? tips[0],
  };
}

export default function BuddyCard({ known, total }: Props) {
  const [species, setSpecies] = useState<Species>("dog");
  const stage = Math.min(9, Math.floor(known / 10));
  const buddy = useMemo(() => getBuddy(stage, species), [stage, species]);
  const levelProgress = Math.min(1, (known % 10) / 10);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setSpecies("dog")}
            style={[
              styles.toggle,
              species === "dog" && styles.toggleActive,
            ]}
          >
            <AppText style={styles.toggleText}>🐶 כלב</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSpecies("cat")}
            style={[
              styles.toggle,
              species === "cat" && styles.toggleActive,
            ]}
          >
            <AppText style={styles.toggleText}>🐱 חתול</AppText>
          </TouchableOpacity>
        </View>
        <AppText style={styles.levelText}>שלב {stage + 1} / 10</AppText>
      </View>

      <View style={styles.buddyRow}>
        <Animated.View style={[styles.emojiBubble, { transform: [{ scale }] }]}>
          <AppText style={styles.emoji}>{buddy.emoji}</AppText>
        </Animated.View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <EnglishText style={styles.title}>{buddy.title}</EnglishText>
          <AppText style={styles.tip}>{buddy.tip}</AppText>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, levelProgress * 100)}%` },
            ]}
          />
        </View>
        <AppText style={styles.progressText}>
          {known} מילים ירוקות | עוד {Math.max(0, 10 - (known % 10 || 10) % 10)} לשדרוג
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.subtle,
    borderRadius: radius.l,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.m,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.s,
  },
  toggle: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleActive: {
    borderColor: colors.primary,
    backgroundColor: "#e0e7ff",
  },
  toggleText: {
    fontWeight: "700",
  },
  levelText: {
    color: colors.muted,
    fontWeight: "700",
  },
  buddyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
  },
  emojiBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1e1b4b",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  tip: {
    color: colors.muted,
  },
  progressRow: {
    gap: spacing.xs,
  },
  barBackground: {
    width: "100%",
    height: 14,
    borderRadius: 8,
    backgroundColor: "#e2e8ff",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.muted,
    fontWeight: "700",
  },
});
