import type { WordSource } from "./wordSource";
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

export type Word = WordSource & {
  group: number;
  index: number;
};

const GROUP_SOURCES: readonly (readonly WordSource[])[] = [
  words1,
  words2,
  words3,
  words4,
  words5,
  words6,
  words7,
  words8,
  words9,
  words10,
];

export const WORDS: Word[] = GROUP_SOURCES.flatMap((groupWords, groupIndex) =>
  groupWords.map((word, index) => ({
    id: word.id,
    en: word.en,
    he: word.he,
    group: groupIndex + 1,
    index,
  })),
);

export const WORD_BY_ID: Map<string, Word> = new Map(
  WORDS.map((word) => [word.id, word]),
);

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

if (isDev) {
  const expectedTotal = GROUP_SOURCES.reduce(
    (sum, group) => sum + group.length,
    0,
  );
  if (WORDS.length !== expectedTotal) {
    throw new Error(
      `Unexpected word count: expected=${expectedTotal} got=${WORDS.length}`,
    );
  }
  if (WORD_BY_ID.size !== WORDS.length) {
    throw new Error("Duplicate word ids detected");
  }
}
