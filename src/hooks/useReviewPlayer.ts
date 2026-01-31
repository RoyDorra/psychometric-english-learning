import { useMemo, useState } from "react";
import { ReviewFilters, Word, WordStatus } from "../domain/types";

type Options = {
  words: Word[];
  statuses: Record<string, WordStatus>;
  filters: ReviewFilters;
};

export function useReviewPlayer({ words, statuses, filters }: Options) {
  const allowedGroups = useMemo(() => {
    const set = new Set<number>();
    for (const id of filters.groups) {
      if (typeof id === "number") {
        set.add(id);
        continue;
      }
      const match = String(id).match(/\d+/);
      if (!match) continue;
      const num = Number(match[0]);
      if (Number.isFinite(num)) set.add(num);
    }
    return set;
  }, [filters.groups]);

  const filtered = useMemo(() => {
    return words.filter((word) => {
      if (!allowedGroups.has(word.group)) return false;
      const status = statuses[word.id] ?? "UNMARKED";
      return filters.statuses.includes(status);
    });
  }, [words, allowedGroups, filters.statuses, statuses]);

  const [index, setIndex] = useState(0);

  const current = filtered[index] ?? null;

  const next = () => {
    setIndex((prev) =>
      filtered.length === 0 ? 0 : (prev + 1) % filtered.length,
    );
  };

  const prev = () => {
    setIndex((prev) =>
      filtered.length === 0
        ? 0
        : (prev - 1 + filtered.length) % filtered.length,
    );
  };

  const resetIndex = () => setIndex(0);

  return {
    current,
    next,
    prev,
    total: filtered.length,
    list: filtered,
    resetIndex,
  };
}
