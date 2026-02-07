import {
  reviewIndex,
  studyIndex,
  studySetup,
  wordAssociations,
  wordDetails,
  wordsGroup,
  wordsIndex,
} from "../routes";

describe("navigation routes", () => {
  it("builds stable href routes", () => {
    expect(wordsIndex()).toBe("/(tabs)/words");
    expect(wordsGroup("group-1")).toEqual({
      pathname: "/(tabs)/words/[groupId]",
      params: { groupId: "group-1" },
    });
    expect(studyIndex()).toBe("/(tabs)/study");
    expect(studySetup(2)).toEqual({
      pathname: "/(tabs)/study/[groupId]/setup",
      params: { groupId: "2" },
    });
    expect(reviewIndex()).toBe("/(tabs)/review");
    expect(wordDetails(42)).toEqual({
      pathname: "/word/[wordId]",
      params: { wordId: "42" },
    });
    expect(wordAssociations("abc")).toEqual({
      pathname: "/word/[wordId]/associations",
      params: { wordId: "abc" },
    });
  });
});
