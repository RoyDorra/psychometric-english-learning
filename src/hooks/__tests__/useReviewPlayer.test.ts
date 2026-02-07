import { act, renderHook } from "@testing-library/react-native";
import { useReviewPlayer } from "../useReviewPlayer";
import { wordFactory } from "@/test/factories";
import type { WordStatus } from "@/src/domain/types";

describe("useReviewPlayer", () => {
  const words = [
    wordFactory({ id: "word-a", group: 1 }),
    wordFactory({ id: "word-b", group: 2 }),
  ];
  const statuses: Record<string, WordStatus> = {
    "word-a": "KNOW",
    "word-b": "DONT_KNOW",
  };

  it("filters by groups and statuses and cycles safely", () => {
    const { result } = renderHook(() =>
      useReviewPlayer({
        words,
        statuses,
        filters: { groups: ["group-1"], statuses: ["KNOW"] },
      }),
    );

    expect(result.current.total).toBe(1);
    expect(result.current.current?.id).toBe("word-a");

    act(() => result.current.next());
    expect(result.current.current?.id).toBe("word-a");

    act(() => result.current.prev());
    expect(result.current.current?.id).toBe("word-a");
  });

  it("returns empty state when nothing matches filters", () => {
    const { result } = renderHook(() =>
      useReviewPlayer({
        words,
        statuses,
        filters: { groups: ["group-3"], statuses: ["KNOW"] },
      }),
    );

    expect(result.current.total).toBe(0);
    expect(result.current.current).toBeNull();

    act(() => result.current.resetIndex());
    expect(result.current.list).toHaveLength(0);
  });

  it("treats empty group filters as all groups", () => {
    const { result } = renderHook(() =>
      useReviewPlayer({
        words,
        statuses,
        filters: { groups: [], statuses: ["KNOW", "DONT_KNOW"] },
      }),
    );

    expect(result.current.total).toBe(2);
    expect(result.current.list.map((word) => word.id)).toEqual([
      "word-a",
      "word-b",
    ]);
  });

  it("does not infer group numbers from arbitrary strings with digits", () => {
    const { result } = renderHook(() =>
      useReviewPlayer({
        words,
        statuses,
        filters: { groups: ["custom2slug"], statuses: ["DONT_KNOW"] },
      }),
    );

    expect(result.current.total).toBe(0);
    expect(result.current.current).toBeNull();
  });
});
