import React from "react";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import HeaderHelpButton from "../HeaderHelpButton";
import PrimaryButton from "../PrimaryButton";
import TextField from "../TextField";
import ModalSheet from "../ModalSheet";
import Screen from "../Screen";
import AppText from "../AppText";
import EnglishText from "../EnglishText";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock("@/src/hooks/useAuth", () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      {children}
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

describe("UI components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("HeaderHelpButton opens menu and triggers navigation and sign out", async () => {
    const push = jest.fn();
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push, replace });

    const { getByText, queryByText } = render(<HeaderHelpButton />, { wrapper });

    act(() => {
      fireEvent.press(getByText("תפריט"));
    });
    expect(getByText("איך ללמוד?")).toBeTruthy();

    act(() => {
      fireEvent.press(getByText("איך ללמוד?"));
    });
    expect(push).toHaveBeenCalledWith("/help");

    act(() => {
      fireEvent.press(getByText("תפריט"));
    });
    act(() => {
      fireEvent.press(getByText("התנתק"));
    });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/(auth)/login"));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    await waitFor(() => expect(queryByText("איך ללמוד?")).toBeNull());

    act(() => {
      fireEvent.press(getByText("תפריט"));
    });
    await waitFor(() => expect(getByText("איך ללמוד?")).toBeTruthy());
    act(() => {
      fireEvent.press(getByText("סגור"));
    });
    await waitFor(() => expect(queryByText("איך ללמוד?")).toBeNull());
  });

  it("PrimaryButton disables while loading", () => {
    const onPress = jest.fn();
    const { getByText, rerender } = render(
      <PrimaryButton title="הוסף" onPress={onPress} disabled />,
    );
    fireEvent.press(getByText("הוסף"));
    expect(onPress).not.toHaveBeenCalled();

    rerender(<PrimaryButton title="הוסף" onPress={onPress} loading />);
    expect(() => getByText("הוסף")).toThrow();
  });

  it("TextField renders label and toggles secure entry", () => {
    const onChange = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <TextField
        label="סיסמה"
        value=""
        onChangeText={onChange}
        placeholder="enter"
        secureTextEntry
      />,
    );
    expect(getByText("סיסמה")).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText("enter"), "abc");
    expect(onChange).toHaveBeenCalledWith("abc");
    fireEvent.press(getByText("הצג"));
  });

  it("ModalSheet renders children with optional elevation toggle", () => {
    const { getByText, rerender } = render(
      <ModalSheet elevated>
        <AppText>Inside</AppText>
      </ModalSheet>,
    );
    expect(getByText("Inside")).toBeTruthy();
    rerender(
      <ModalSheet elevated={false}>
        <AppText>Flat</AppText>
      </ModalSheet>,
    );
    expect(getByText("Flat")).toBeTruthy();
  });

  it("Screen renders scrollable content when requested", () => {
    const { getByText, getByTestId } = render(
      <Screen scrollable>
        <AppText testID="content">Hello</AppText>
      </Screen>,
      { wrapper },
    );
    expect(getByText("Hello")).toBeTruthy();
    expect(getByTestId("content")).toBeTruthy();
  });

  it("AppText and EnglishText apply direction markers", () => {
    const { getByText } = render(
      <>
        <AppText>שלום</AppText>
        <EnglishText>hello</EnglishText>
      </>,
    );
    expect(getByText("שלום")).toBeTruthy();
    const englishNode = getByText("\u2066hello\u2069");
    expect(englishNode).toBeTruthy();
  });
});
