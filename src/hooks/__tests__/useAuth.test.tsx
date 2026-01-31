import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "../useAuth";

jest.mock("../../core/bootstrap", () => ({
  bootstrap: jest.fn(async () => {}),
}));

jest.mock("@/src/repositories/userRepo", () => {
  const actual = jest.requireActual("@/src/repositories/userRepo");
  return {
    ...actual,
    getSession: jest.fn(),
    getUserById: jest.fn(),
    loginUser: jest.fn(),
    registerUser: jest.fn(),
    logoutUser: jest.fn(),
  };
});

const mockRepo = jest.requireMock("@/src/repositories/userRepo") as jest.Mocked<
  typeof import("@/src/repositories/userRepo")
>;

describe("useAuth", () => {
  beforeEach(async () => {
    await (AsyncStorage as any).clear?.();
    jest.clearAllMocks();
    mockRepo.getSession.mockResolvedValue(null);
    mockRepo.getUserById.mockResolvedValue(null);
  });

  it("bootstraps without a session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("loads existing session and user on mount", async () => {
    const session = { user: { id: "user-123" } } as const;
    const user = { id: "user-123", email: "a@example.com", passwordHash: "", createdAt: "" };
    mockRepo.getSession.mockResolvedValueOnce(session as any);
    mockRepo.getUserById.mockResolvedValueOnce(user as any);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    expect(result.current.session?.user.id).toBe("user-123");
    expect(result.current.user?.email).toBe("a@example.com");
  });

  it("login, register, and logout update auth state", async () => {
    mockRepo.loginUser.mockResolvedValueOnce({
      user: { id: "u1", email: "login@test.com", passwordHash: "", createdAt: "" },
      session: { user: { id: "u1" }, token: "t1" },
    });
    mockRepo.registerUser.mockResolvedValueOnce({
      user: { id: "u2", email: "reg@test.com", passwordHash: "", createdAt: "" },
      session: { user: { id: "u2" }, token: "t2" },
    });
    mockRepo.logoutUser.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    await act(async () => {
      await result.current.login("login@test.com", "Password1");
    });
    await waitFor(() => expect(result.current.session?.token).toBe("t1"));
    expect(result.current.user?.id).toBe("u1");

    await act(async () => {
      await result.current.register("reg@test.com", "Password1");
    });
    await waitFor(() => expect(result.current.session?.token).toBe("t2"));
    expect(result.current.user?.id).toBe("u2");

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
