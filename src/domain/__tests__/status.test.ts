import {
  DEFAULT_REVIEW_STATUSES,
  DEFAULT_STUDY_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  getStatusColor,
  getStatusLabel,
} from "../status";

describe("status helpers", () => {
  it("returns stable labels and colors", () => {
    expect(getStatusLabel("KNOW")).toBe(STATUS_LABELS.KNOW);
    expect(getStatusColor("DONT_KNOW")).toBe(STATUS_COLORS.DONT_KNOW);
  });

  it("exposes default study and review lists", () => {
    expect(DEFAULT_STUDY_STATUSES).toContain("PARTIAL");
    expect(DEFAULT_REVIEW_STATUSES).toContain("KNOW");
  });
});
