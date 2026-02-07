import type { Href } from "expo-router";

const WORDS_BASE = "/(tabs)/words";
const STUDY_BASE = "/(tabs)/study";
const REVIEW_BASE = "/(tabs)/review";

export function wordsIndex(): Href {
  return WORDS_BASE as Href;
}

export function wordsGroup(groupId: string | number): Href {
  return {
    pathname: "/(tabs)/words/[groupId]",
    params: { groupId: String(groupId) },
  } as Href;
}

export function studyIndex(): Href {
  return STUDY_BASE as Href;
}

export function studySetup(groupId: string | number): Href {
  return {
    pathname: "/(tabs)/study/[groupId]/setup",
    params: { groupId: String(groupId) },
  } as Href;
}

export function reviewIndex(): Href {
  return REVIEW_BASE as Href;
}

export function wordDetails(wordId: string | number): Href {
  return {
    pathname: "/word/[wordId]",
    params: { wordId: String(wordId) },
  } as Href;
}

export function wordAssociations(wordId: string | number): Href {
  return {
    pathname: "/word/[wordId]/associations",
    params: { wordId: String(wordId) },
  } as Href;
}
