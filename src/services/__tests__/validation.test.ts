import { validateEmail, validatePassword } from "../validation";

describe("validation", () => {
  it("rejects empty or malformed email addresses", () => {
    expect(validateEmail("")).toBe("אנא הזינו אימייל");
    expect(validateEmail("not-an-email")).toBe("אימייל לא תקין");
    expect(validateEmail("name@example.com")).toBeNull();
  });

  it("enforces password complexity", () => {
    expect(validatePassword("short")).toContain("לפחות 8 תווים");
    expect(validatePassword("longpassword")).toContain("מספר אחד");
    expect(validatePassword("valid123")).toBeNull();
  });
});
