import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { useAuth } from "@/src/hooks/useAuth";
import { validateEmail, validatePassword } from "@/src/services/validation";
import { spacing } from "@/src/ui/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailError = validateEmail(email);
  const passwordError = password
    ? validatePassword(password)
    : "סיסמה חייבת להיות לפחות 8 תווים ולכלול אות ומספר";
  const confirmError = !confirm
    ? submitAttempted
      ? "אנא אשרו סיסמה"
      : null
    : confirm !== password
      ? "סיסמאות אינן תואמות"
      : null;
  const isValid =
    !emailError &&
    !passwordError &&
    confirm.length > 0 &&
    confirm === password;

  const handleRegister = async () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    try {
      setLoading(true);
      setError(null);
      await signUp(email, password);
      router.replace("/(tabs)/words");
    } catch (err) {
      setError((err as Error).message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen withPadding>
      <View style={{ gap: spacing.l }}>
        <View style={{ gap: spacing.s }}>
          <AppText style={{ fontSize: 22, fontWeight: "700" }}>הרשמה</AppText>
          <AppText style={{ color: "#475569" }}>
            צרו פרופיל כדי לשמור את התקדמות הלמידה במכשיר
          </AppText>
        </View>

        <View style={{ gap: spacing.m }}>
          <TextField
            label="אימייל"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={email ? emailError : null}
          />
          <TextField
            label="סיסמה"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            error={password ? passwordError : null}
          />
          <TextField
            label="אישור סיסמה"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            error={confirmError}
          />
          {error ? <AppText style={{ color: "red" }}>{error}</AppText> : null}
          <PrimaryButton
            title="צור משתמש"
            onPress={handleRegister}
            disabled={!isValid}
            loading={loading}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.s }}>
          <AppText>כבר רשומים?</AppText>
          <Link href="/(auth)/login" style={{ color: "#2563eb", fontWeight: "700" }}>
            חזרה להתחברות
          </Link>
        </View>
      </View>
    </Screen>
  );
}
