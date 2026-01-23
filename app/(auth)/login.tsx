import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import AppText from "../../components/AppText";
import PrimaryButton from "../../components/PrimaryButton";
import Screen from "../../components/Screen";
import TextField from "../../components/TextField";
import { useAuth } from "../../src/hooks/useAuth";
import { validateEmail, validatePassword } from "../../src/services/validation";
import { spacing } from "../../src/ui/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = validateEmail(email);
  const passwordError =
    password.length > 0 ? validatePassword(password) : "סיסמה חייבת להיות לפחות 8 תווים ולכלול אות ומספר";
  const isValid = !emailError && !passwordError;

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      router.replace("/(tabs)/words");
    } catch (err) {
      setError((err as Error).message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen withPadding>
      <View style={{ gap: spacing.l }}>
        <View style={{ gap: spacing.s }}>
          <AppText style={{ fontSize: 22, fontWeight: "700" }}>ברוכים הבאים</AppText>
          <AppText style={{ color: "#475569" }}>
            התחברו כדי להתחיל לשנן מילים לפסיכומטרי
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
            autoComplete="password"
            error={password ? passwordError : null}
          />
          {error ? <AppText style={{ color: "red" }}>{error}</AppText> : null}
          <PrimaryButton
            title="התחבר"
            onPress={handleLogin}
            disabled={!isValid}
            loading={loading}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.s }}>
          <AppText>אין לכם משתמש?</AppText>
          <Link href="/(auth)/register" style={{ color: "#2563eb", fontWeight: "700" }}>
            להרשמה
          </Link>
        </View>
      </View>
    </Screen>
  );
}
