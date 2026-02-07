import { act, renderHook, waitFor } from "@testing-library/react-native";
import { WordProvider, useWords } from "../useWords";

jest.mock("../useAuth", () => ({
  useAuth: () => ({
    session: { user: { id: "user-1" } },
    user: { id: "user-1", email: "test@example.com" },
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/src/repositories/wordRepo", () => {
  const actual = jest.requireActual("@/src/repositories/wordRepo");
  return {
    ...actual,
    getStatuses: jest.fn(),
    getHelpPreference: jest.fn(),
    getStudyPreferences: jest.fn(),
    getReviewFilters: jest.fn(),
    setStatus: jest.fn(),
    setStudyPreferences: jest.fn(),
    setReviewFilters: jest.fn(),
    setHelpPreference: jest.fn(),
  };
});

const repo = jest.requireMock("@/src/repositories/wordRepo") as jest.Mocked<
  typeof import("@/src/repositories/wordRepo")
>;

describe("useWords", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repo.getStatuses.mockResolvedValue({ "word-1": "KNOW" });
    repo.getHelpPreference.mockResolvedValue({ seen: false });
    repo.getStudyPreferences.mockResolvedValue({
      chunkSize: 7,
      statuses: ["UNMARKED", "DONT_KNOW", "PARTIAL"],
    });
    repo.getReviewFilters.mockResolvedValue({
      groups: repo.getGroups().map((g) => g.id),
      statuses: ["UNMARKED", "DONT_KNOW", "PARTIAL", "KNOW"],
    });
    repo.setStatus.mockResolvedValue({});
    repo.setStudyPreferences.mockResolvedValue({
      chunkSize: 5,
      statuses: ["KNOW"],
    });
    repo.setReviewFilters.mockResolvedValue({
      groups: ["group-1"],
      statuses: ["KNOW"],
    });
    repo.setHelpPreference.mockResolvedValue({ seen: true });
  });

  const renderWords = () => renderHook(() => useWords(), { wrapper: WordProvider });

  it("bootstraps statuses and preferences for the current user", async () => {
    const { result } = renderWords();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.statuses).toEqual({ "word-1": "KNOW" });
    expect(result.current.helpSeen).toBe(false);
    expect(result.current.studyPreferences.chunkSize).toBe(7);
    expect(result.current.reviewFilters.groups.length).toBe(repo.getGroups().length);
    expect(result.current.error).toBeNull();
  });

  it("updates status, preferences, and help flag", async () => {
    const { result } = renderWords();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateStatus("word-2", "DONT_KNOW");
      await result.current.setStudyPreferences({ chunkSize: 3, statuses: ["KNOW"] });
      await result.current.setReviewFilters({ groups: ["group-1"], statuses: ["KNOW"] });
      await result.current.markHelpSeen();
    });

    expect(repo.setStatus).toHaveBeenCalledWith("user-1", "word-2", "DONT_KNOW");
    expect(repo.setStudyPreferences).toHaveBeenCalledWith("user-1", {
      chunkSize: 3,
      statuses: ["KNOW"],
    });
    expect(repo.setReviewFilters).toHaveBeenCalledWith("user-1", {
      groups: ["group-1"],
      statuses: ["KNOW"],
    });
    expect(repo.setHelpPreference).toHaveBeenCalledWith("user-1", { seen: true });
  });

  it("retrieves words by id and group", async () => {
    const { result } = renderWords();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstGroup = repo.getGroups()[0];
    const words = result.current.getWordsForGroup(firstGroup.id);
    expect(words.length).toBeGreaterThan(0);

    const missing = result.current.getWord("missing");
    expect(missing).toBeNull();
  });

  it("falls back to defaults when initial load fails", async () => {
    repo.getStatuses.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderWords();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.statuses).toEqual({});
    expect(result.current.helpSeen).toBe(false);
    expect(result.current.studyPreferences.chunkSize).toBe(7);
    expect(result.current.reviewFilters.groups).toHaveLength(repo.getGroups().length);
    expect(result.current.error).toBe("network down");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it("rolls back optimistic status update when write fails", async () => {
    repo.setStatus.mockRejectedValueOnce(new Error("write failed"));
    const { result } = renderWords();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateStatus("word-1", "UNMARKED");
    });

    expect(result.current.statuses).toEqual({ "word-1": "KNOW" });
    expect(result.current.error).toBe("write failed");
  });
});
