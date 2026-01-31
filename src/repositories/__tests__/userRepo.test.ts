import {
  getSession,
  getUserById,
  loginUser,
  logoutUser,
  registerUser,
} from "../userRepo";
import { createFakeStorage, installFakeStorage } from "@/test/fakeStorage";

describe("userRepo", () => {
  beforeEach(() => {
    installFakeStorage(createFakeStorage());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers a user and returns a session", async () => {
    const { user, session } = await registerUser("person@example.com", "Password1");
    expect(user.id).toBeDefined();
    expect(session.user.id).toBe(user.id);

    const storedSession = await getSession();
    expect(storedSession?.user.id).toBe(user.id);
  });

  it("logs in an existing user and rejects duplicates", async () => {
    const { user } = await registerUser("dup@example.com", "Password1");
    const login = await loginUser("dup@example.com", "Password1");
    expect(login.user.id).toBe(user.id);

    await expect(registerUser("dup@example.com", "Password1")).rejects.toThrow(
      "משתמש כבר קיים",
    );
  });

  it("clears session on logout", async () => {
    await registerUser("logout@example.com", "Password1");
    await logoutUser();
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("handles missing users and invalid passwords", async () => {
    await expect(loginUser("missing@example.com", "Password1")).rejects.toThrow(
      "משתמש לא נמצא",
    );
    await registerUser("exists@example.com", "Password1");
    await expect(loginUser("exists@example.com", "Wrong123")).rejects.toThrow(
      "סיסמה שגויה",
    );
  });

  it("returns null for unknown user id", async () => {
    await registerUser("someone@example.com", "Password1");
    const user = await getUserById("does-not-exist");
    expect(user).toBeNull();
  });
});
