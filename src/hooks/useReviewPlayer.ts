import { useMemo, useState } from "react";
import { GROUPS } from "../data/words";
import { ReviewFilters, Word, WordStatus } from "../domain/types";

type Options = {
  words: Word[];
  statuses: Record<string, WordStatus>;
  filters: ReviewFilters;
};

const GROUP_ID_TO_NUMBER = new Map(
  GROUPS.map((group) => [group.id, group.order]),
);

export function useReviewPlayer({ words, statuses, filters }: Options) {
  const allowedGroups = useMemo(() => {
    if (filters.groups.length === 0) {
      return null;
    }

    const set = new Set<number>();
    for (const id of filters.groups) {
      if (typeof id === "number") {
        set.add(id);
        continue;
      }

      const mapped = GROUP_ID_TO_NUMBER.get(id);
      if (typeof mapped === "number") {
        set.add(mapped);
        continue;
      }

      const num = Number(id);
      if (Number.isFinite(num)) set.add(num);
    }
    return set;
  }, [filters.groups]);

  const filtered = useMemo(() => {
    return words.filter((word) => {
      if (allowedGroups && !allowedGroups.has(word.group)) return false;
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
