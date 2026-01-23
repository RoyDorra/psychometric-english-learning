import { useRouter } from "expo-router";
import { View } from "react-native";
import AppText from "../components/AppText";
import PrimaryButton from "../components/PrimaryButton";
import Screen from "../components/Screen";
import { useWords } from "../src/hooks/useWords";
import { spacing } from "../src/ui/theme";

export default function HelpScreen() {
  const router = useRouter();
  const { helpSeen, markHelpSeen } = useWords();

  const handleDismiss = async () => {
    await markHelpSeen();
    router.back();
  };

  return (
    <Screen withPadding scrollable>
      <View style={{ gap: spacing.m }}>
        <AppText style={{ fontSize: 22, fontWeight: "700" }}>
          איך ללמוד?
        </AppText>
        <AppText>
          • התחילו בקבוצות עם סטטוס אפור/אדום וקדמו את הסטטוס אחרי כל חזרה.
        </AppText>
        <AppText>
          • אסוציאציות בעברית מחזקות את הזיכרון – הוסיפו שלכם והצביעו למועילות.
        </AppText>
        <AppText>
          • בלמידה (מקבצים) עברו לפי סדר, בשינון דפדפו במהירות והסתירו/הציגו תרגום.
        </AppText>
        <AppText>
          • קבעו גודל מקבץ שמתאים לכם ושמרו על עקביות יומית קצרה.
        </AppText>

        <PrimaryButton
          title={helpSeen ? "סגור" : "אל תציג שוב"}
          onPress={handleDismiss}
        />
      </View>
    </Screen>
  );
}
