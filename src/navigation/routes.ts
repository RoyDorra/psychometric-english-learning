import type { Href } from "expo-router";

const WORDS_BASE = "/(tabs)/words";
const WORD_BASE = "/(tabs)/words/word";
const STUDY_BASE = "/(tabs)/study";

export function wordsGroup(groupId: string | number): Href {
  return `${WORDS_BASE}/${groupId}` as Href;
}

export function studySetup(groupId: string | number): Href {
  return `${STUDY_BASE}/${groupId}/setup` as Href;
}

export function wordDetails(wordId: string | number): Href {
  return `${WORD_BASE}/${wordId}` as Href;
}

export function wordAssociations(wordId: string | number): Href {
  return `${wordDetails(wordId)}.associations` as Href;
}
