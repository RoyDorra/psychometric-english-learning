import { ReactElement, PropsWithChildren } from "react";
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  RenderHookOptions,
  RenderOptions,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/src/hooks/useAuth";
import { WordProvider } from "@/src/hooks/useWords";
import { AssociationsProvider } from "@/src/hooks/useAssociations";

function Providers({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <WordProvider>
            <AssociationsProvider>{children}</AssociationsProvider>
          </WordProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return rtlRender(ui, { wrapper: Providers, ...options });
}

export function renderHook<Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper">,
) {
  return rtlRenderHook(hook, { wrapper: Providers, ...options });
}

export { Providers as TestProviders };
