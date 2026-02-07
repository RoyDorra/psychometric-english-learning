import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { act, fireEvent, render, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AssociationsProvider, useAssociations } from "../useAssociations";
import * as associationRepo from "@/src/repositories/associationRepo";
import { resetMockSupabase } from "@/test/supabaseInMemory";

jest.mock("@/src/services/supabase", () => {
  const { mockSupabase } = require("@/test/supabaseInMemory");
  return { supabase: mockSupabase };
});

jest.mock("../useAuth", () => {
  const React = jest.requireActual("react") as typeof import("react");
  const value = {
    user: { id: "test-user", email: "test@example.com" },
    session: { user: { id: "test-user" } },
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  };
  const Ctx = React.createContext(value);
  const AuthProvider = ({ children }: { children: React.ReactNode }) => (
    <Ctx.Provider value={value}>{children}</Ctx.Provider>
  );
  const useAuth = () => React.useContext(Ctx);
  return { AuthProvider, useAuth };
});

const wordId = "word-1";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AssociationsProvider>{children}</AssociationsProvider>;
}

function AssociationsHarness({ word = wordId }: { word?: string }) {
  const assoc = useAssociations(word);
  const firstPublic = assoc.publicList[0];
  const firstPrivate = assoc.privateList[0];

  return (
    <View>
      <Text testID="loading">{assoc.loading ? "loading" : "ready"}</Text>
      <Text testID="public-count">{assoc.publicList.length}</Text>
      <Text testID="saved-count">{assoc.savedList.length}</Text>
      <Text testID="private-count">{assoc.privateList.length}</Text>
      <Text testID="first-liked">{firstPublic?.isLikedByMe ? "liked" : "not-liked"}</Text>
      <Text testID="first-saved">{firstPublic?.isSavedByMe ? "saved" : "not-saved"}</Text>
      <TouchableOpacity testID="add-public" onPress={() => assoc.addPublic(word, "ציבורית")}>
        <Text>add-public</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="add-private" onPress={() => assoc.addPrivate(word, "פרטית")}>
        <Text>add-private</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="toggle-like"
        onPress={() => firstPublic && assoc.toggleLike(word, firstPublic.id)}
      >
        <Text>toggle-like</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="toggle-save"
        onPress={() => firstPublic && assoc.toggleSave(word, firstPublic.id)}
      >
        <Text>toggle-save</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="delete-private"
        onPress={() => firstPrivate && assoc.deletePrivate(word, firstPrivate.id)}
      >
        <Text>delete-private</Text>
      </TouchableOpacity>
    </View>
  );
}

describe("useAssociations", () => {
  beforeEach(async () => {
    jest.useRealTimers();
    await (AsyncStorage as any).clear?.();
    resetMockSupabase();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads empty lists on first refresh", async () => {
    const { getByTestId } = render(<AssociationsHarness />, { wrapper: Wrapper });

    await waitFor(() => expect(getByTestId("loading").props.children).toBe("ready"));
    expect(getByTestId("public-count").props.children).toBe(0);
    expect(getByTestId("saved-count").props.children).toBe(0);
    expect(getByTestId("private-count").props.children).toBe(0);
  });

  it("adds public associations and toggles like/save state", async () => {
    const { getByTestId } = render(<AssociationsHarness />, { wrapper: Wrapper });

    await act(async () => {
      fireEvent.press(getByTestId("add-public"));
    });

    await waitFor(() => expect(getByTestId("public-count").props.children).toBe(1));

    await act(async () => {
      fireEvent.press(getByTestId("toggle-like"));
      fireEvent.press(getByTestId("toggle-save"));
    });

    await waitFor(() => expect(getByTestId("saved-count").props.children).toBe(1));
    expect(getByTestId("first-liked").props.children).toBe("liked");
    expect(getByTestId("first-saved").props.children).toBe("saved");
  });

  it("adds and removes private associations", async () => {
    const { getByTestId } = render(<AssociationsHarness />, { wrapper: Wrapper });

    await act(async () => {
      fireEvent.press(getByTestId("add-private"));
    });

    await waitFor(() => expect(getByTestId("private-count").props.children).toBe(1));

    await act(async () => {
      fireEvent.press(getByTestId("delete-private"));
    });

    await waitFor(() => expect(getByTestId("private-count").props.children).toBe(0));
  });

  it("resets loading when refresh fails", async () => {
    const mock = jest
      .spyOn(associationRepo, "listPublicByWord")
      .mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useAssociations(), { wrapper: Wrapper });
    await act(async () => {
      await expect(result.current.refresh(wordId)).rejects.toThrow("boom");
    });
    expect(result.current.loading).toBe(false);

    mock.mockRestore();
  });
});
