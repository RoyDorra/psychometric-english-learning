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
  it("builds stable href strings", () => {
    expect(wordsIndex()).toBe("/(tabs)/words");
    expect(wordsGroup("group-1")).toBe("/(tabs)/words/group-1");
    expect(studyIndex()).toBe("/(tabs)/study");
    expect(studySetup(2)).toBe("/(tabs)/study/2/setup");
    expect(reviewIndex()).toBe("/(tabs)/review");
    expect(wordDetails(42)).toBe("/word/42");
    expect(wordAssociations("abc")).toBe("/word/abc/associations");
  });
});
