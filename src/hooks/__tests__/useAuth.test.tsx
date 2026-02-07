import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../useAuth";

jest.mock("../../core/bootstrap", () => ({
  bootstrap: jest.fn(async () => {}),
}));

jest.mock("../../services/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const mockSupabase = jest.requireMock("../../services/supabase") as {
  supabase: {
    auth: {
      getSession: jest.Mock;
      onAuthStateChange: jest.Mock;
      signInWithPassword: jest.Mock;
      signUp: jest.Mock;
      signOut: jest.Mock;
    };
  };
};

describe("useAuth", () => {
  let authStateChangeListener:
    | ((event: string, session: any | null) => void)
    | null = null;
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authStateChangeListener = null;
    unsubscribe.mockReset();

    mockSupabase.supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.supabase.auth.onAuthStateChange.mockImplementation(
      (listener: (event: string, session: any | null) => void) => {
        authStateChangeListener = listener;
        return {
          data: {
            subscription: {
              unsubscribe,
            },
          },
        };
      },
    );
    mockSupabase.supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    mockSupabase.supabase.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    mockSupabase.supabase.auth.signOut.mockResolvedValue({
      error: null,
    });
  });

  it("bootstraps without a session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("loads existing session and user on mount", async () => {
    const session = {
      access_token: "token",
      refresh_token: "refresh",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: 123,
      user: { id: "user-123", email: "a@example.com" },
    };

    mockSupabase.supabase.auth.getSession.mockResolvedValueOnce({
      data: { session },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.session?.user.id).toBe("user-123");
    expect(result.current.user?.email).toBe("a@example.com");
  });

  it("signIn, signUp, and signOut update auth state", async () => {
    const signInData = {
      user: { id: "u1", email: "login@test.com" },
      session: {
        access_token: "t1",
        refresh_token: "r1",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 123,
        user: { id: "u1", email: "login@test.com" },
      },
    };

    const signUpData = {
      user: { id: "u2", email: "reg@test.com" },
      session: {
        access_token: "t2",
        refresh_token: "r2",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 123,
        user: { id: "u2", email: "reg@test.com" },
      },
    };

    mockSupabase.supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: signInData,
      error: null,
    });
    mockSupabase.supabase.auth.signUp.mockResolvedValueOnce({
      data: signUpData,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn("login@test.com", "Password1");
    });
    await waitFor(() => expect(result.current.session?.access_token).toBe("t1"));
    expect(result.current.user?.id).toBe("u1");

    await act(async () => {
      await result.current.signUp("reg@test.com", "Password1");
    });
    await waitFor(() => expect(result.current.session?.access_token).toBe("t2"));
    expect(result.current.user?.id).toBe("u2");

    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("applies auth state change events and unsubscribes", async () => {
    const { result, unmount } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      authStateChangeListener?.("SIGNED_IN", {
        access_token: "token",
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 123,
        user: { id: "evt-user", email: "evt@example.com" },
      });
    });

    expect(result.current.user?.id).toBe("evt-user");
    expect(result.current.session?.user.id).toBe("evt-user");

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("handles getSession error and clears loading state", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockSupabase.supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("session failed"),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to restore auth session",
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });

  it("throws auth method errors from Supabase", async () => {
    mockSupabase.supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: new Error("sign-in failed"),
    });
    mockSupabase.supabase.auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: new Error("sign-up failed"),
    });
    mockSupabase.supabase.auth.signOut.mockResolvedValueOnce({
      error: new Error("sign-out failed"),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.signIn("a@test.com", "Password1")).rejects.toThrow(
      "sign-in failed",
    );
    await expect(result.current.signUp("a@test.com", "Password1")).rejects.toThrow(
      "sign-up failed",
    );
    await expect(result.current.signOut()).rejects.toThrow("sign-out failed");
  });

  it("ignores auth state updates after unmount", async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    unmount();
    expect(() => {
      authStateChangeListener?.("SIGNED_IN", {
        access_token: "late-token",
        refresh_token: "late-refresh",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 123,
        user: { id: "late-user", email: "late@example.com" },
      });
    }).not.toThrow();
  });

  it("throws if useAuth is called outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within AuthProvider",
    );
  });
});
