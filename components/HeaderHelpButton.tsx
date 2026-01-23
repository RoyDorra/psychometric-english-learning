import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ModalSheet from "./ModalSheet";
import { useAuth } from "../src/hooks/useAuth";
import { clearAppStorage } from "../src/storage/clearAppStorage";
import { colors, radius, spacing } from "../src/ui/theme";

export default function HeaderHelpButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"logout" | "reset" | null>(null);

  const actions = useMemo(
    () => [
      {
        label: "איך ללמוד?",
        onPress: async () => {
          setVisible(false);
          setConfirmReset(false);
          router.push("/help");
        },
      },
      {
        label: "התנתק",
        onPress: async () => {
          setLoadingAction("logout");
          setConfirmReset(false);
          await logout();
          setLoadingAction(null);
          setVisible(false);
          router.replace("/(auth)/login");
        },
      },
      {
        label: "איפוס נתונים מקומיים",
        onPress: async () => {
          setConfirmReset(true);
        },
      },
    ],
    [logout, router]
  );

  const handleReset = async () => {
    setLoadingAction("reset");
    await clearAppStorage();
    setLoadingAction(null);
    setVisible(false);
    setConfirmReset(false);
    router.replace("/(auth)/login");
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setVisible(true);
          setConfirmReset(false);
        }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.text}>תפריט</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <ModalSheet>
            {confirmReset ? (
              <View style={styles.sheetContent}>
                <Text style={styles.title}>איפוס נתונים?</Text>
                <Text style={styles.subtitle}>
                  פעולה זו תמחק משתמשים, סשן, סטטוסים ואסוציאציות מהמכשיר.
                </Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn]}
                    onPress={() => setConfirmReset(false)}
                  >
                    <Text style={styles.secondaryText}>בטל</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, styles.dangerBtn]}
                    onPress={handleReset}
                    disabled={loadingAction === "reset"}
                  >
                    <Text style={styles.primaryText}>
                      {loadingAction === "reset" ? "מאפס..." : "כן, לאפס"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.sheetContent}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.menuItem}
                    onPress={action.onPress}
                    disabled={loadingAction === "logout"}
                  >
                    <Text style={styles.menuText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeText}>סגור</Text>
                </TouchableOpacity>
              </View>
            )}
          </ModalSheet>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: colors.primary,
    fontWeight: "700",
    writingDirection: "rtl",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "flex-end",
  },
  sheetContent: {
    gap: spacing.m,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    writingDirection: "rtl",
    textAlign: "right",
  },
  subtitle: {
    color: colors.muted,
    writingDirection: "rtl",
    textAlign: "right",
  },
  menuItem: {
    paddingVertical: spacing.s,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "700",
    writingDirection: "rtl",
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    gap: spacing.s,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    writingDirection: "rtl",
  },
  secondaryBtn: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "700",
    writingDirection: "rtl",
  },
  closeBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.s,
    paddingVertical: 6,
  },
  closeText: {
    color: colors.muted,
    fontWeight: "700",
    writingDirection: "rtl",
  },
});
