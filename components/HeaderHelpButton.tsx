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
import { useAuth } from "@/src/hooks/useAuth";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function HeaderHelpButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"logout" | null>(null);

  // TODO(supabase): Full account reset should be implemented via Supabase RPC/Edge Function; any local cache reset will live in dev-only tools.
  const actions = useMemo(
    () => [
      {
        label: "איך ללמוד?",
        onPress: async () => {
          setVisible(false);
          router.push("/help");
        },
      },
      {
        label: "התנתק",
        onPress: async () => {
          setLoadingAction("logout");
          await logout();
          setLoadingAction(null);
          setVisible(false);
          router.replace("/(auth)/login");
        },
      },
    ],
    [logout, router]
  );

  return (
    <>
      <Pressable
        onPress={() => {
          setVisible(true);
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
  menuItem: {
    paddingVertical: spacing.s,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "700",
    writingDirection: "rtl",
    textAlign: "right",
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
