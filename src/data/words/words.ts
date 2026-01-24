import type { Word } from "../../domain/types";
import words1 from "../../../words_english_1";
import words2 from "../../../words_english_2";
import words3 from "../../../words_english_3";
import words4 from "../../../words_english_4";
import words5 from "../../../words_english_5";
import words6 from "../../../words_english_6";
import words7 from "../../../words_english_7";
import words8 from "../../../words_english_8";
import words9 from "../../../words_english_9";
import words10 from "../../../words_english_10";

export type RawRow = readonly [english: string, ...hebrewMeanings: string[]];
type RawRows = readonly RawRow[];

declare const __DEV__: boolean;

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

const RAW_GROUPS: { id: string; order: number; rows: RawRows }[] = [
  { id: "group-1", order: 1, rows: words1 as RawRows },
  { id: "group-2", order: 2, rows: words2 as RawRows },
  { id: "group-3", order: 3, rows: words3 as RawRows },
  { id: "group-4", order: 4, rows: words4 as RawRows },
  { id: "group-5", order: 5, rows: words5 as RawRows },
  { id: "group-6", order: 6, rows: words6 as RawRows },
  { id: "group-7", order: 7, rows: words7 as RawRows },
  { id: "group-8", order: 8, rows: words8 as RawRows },
  { id: "group-9", order: 9, rows: words9 as RawRows },
  { id: "group-10", order: 10, rows: words10 as RawRows },
];

const SPACE_RE = /\s+/g;
const TRAILING_COMMA_RE = /[,，]$/;
const INTERNAL_SPACE_RE = /\S\s+\S/;

function collapseWhitespace(value: string) {
  return value.replace(SPACE_RE, " ").trim();
}

function normalizeEnglish(raw: string) {
  return collapseWhitespace(raw);
}

function normalizeHebrew(raw: string) {
  const trimmed = collapseWhitespace(raw);
  return trimmed.replace(TRAILING_COMMA_RE, "");
}

function normalizedEnglishKey(english: string) {
  return collapseWhitespace(english).toLowerCase();
}

function slugifyId(key: string) {
  const base = key
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "word";
}

function validateString(
  raw: string,
  cleaned: string,
  allowTrailingComma: boolean
) {
  if (!raw.includes("-") && cleaned.includes("-")) {
    throw new Error(`Unexpected hyphen introduced: "${raw}" -> "${cleaned}"`);
  }
  if (!raw.includes("_") && cleaned.includes("_")) {
    throw new Error(
      `Unexpected underscore introduced: "${raw}" -> "${cleaned}"`
    );
  }
  if (INTERNAL_SPACE_RE.test(raw) && !INTERNAL_SPACE_RE.test(cleaned)) {
    throw new Error(`Internal spaces removed: "${raw}" -> "${cleaned}"`);
  }
  const rawTrimmed = raw.trim();
  const rawComparable = collapseWhitespace(
    allowTrailingComma ? rawTrimmed.replace(TRAILING_COMMA_RE, "") : rawTrimmed
  ).replace(SPACE_RE, "");
  const cleanedComparable = cleaned.replace(SPACE_RE, "");
  if (rawComparable !== cleanedComparable) {
    throw new Error(`Unexpected character change: "${raw}" -> "${cleaned}"`);
  }
}

function dedupeMeanings(meanings: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const meaning of meanings) {
    if (seen.has(meaning)) continue;
    seen.add(meaning);
    result.push(meaning);
  }
  return result;
}

function buildWords() {
  const words: Word[] = [];
  const idCounts = new Map<string, number>();
  let rawCount = 0;
  let skippedEmptyEnglish = 0;
  let skippedEmptyMeanings = 0;

  for (const group of RAW_GROUPS) {
    for (const row of group.rows) {
      rawCount += 1;
      const rawEnglish = String(row[0] ?? "");
      const english = normalizeEnglish(rawEnglish);

      if (isDev) {
        validateString(rawEnglish, english, false);
      }

      if (!english) {
        skippedEmptyEnglish += 1;
        continue;
      }

      const rawMeanings = row.slice(1).map((value) => String(value ?? ""));
      const meanings: string[] = [];
      for (const raw of rawMeanings) {
        const cleaned = normalizeHebrew(raw);
        if (isDev) {
          validateString(raw, cleaned, true);
        }
        if (raw.trim().length === 0) {
          continue;
        }
        if (cleaned.length === 0) {
          if (isDev) {
            throw new Error(`Meaning cleaned to empty: "${raw}"`);
          }
          continue;
        }
        meanings.push(cleaned);
      }

      if (!meanings.length) {
        skippedEmptyMeanings += 1;
        continue;
      }

      const hebrewTranslations = dedupeMeanings(meanings);
      const key = normalizedEnglishKey(english);
      let id = slugifyId(key);
      const nextCount = (idCounts.get(id) ?? 0) + 1;
      idCounts.set(id, nextCount);
      if (nextCount > 1) id = `${id}-${nextCount}`;

      words.push({
        id,
        groupId: group.id,
        english,
        hebrewTranslations,
      });
    }
  }

  if (isDev) {
    const expectedCount = rawCount - skippedEmptyEnglish - skippedEmptyMeanings;
    if (words.length !== expectedCount) {
      throw new Error(
        `Unexpected word count: raw=${rawCount} skipped=${skippedEmptyEnglish +
          skippedEmptyMeanings} produced=${words.length}`
      );
    }
    const uniqueIds = new Set(words.map((word) => word.id));
    if (uniqueIds.size !== words.length) {
      throw new Error("Duplicate word ids detected");
    }
  }

  return words;
}

export const WORDS: Word[] = buildWords();
