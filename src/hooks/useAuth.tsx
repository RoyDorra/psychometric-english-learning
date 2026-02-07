import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { bootstrap } from "../core/bootstrap";
import { Session, User } from "../domain/types";
import {
  getSession,
  getUserById,
  loginUser,
  logoutUser,
  registerUser,
} from "../repositories/userRepo";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await bootstrap();
        const existingSession = await getSession();
        const existingUserId = existingSession?.user?.id;
        if (!active) return;
        if (existingUserId) {
          const existingUser = await getUserById(existingUserId);
          if (!active) return;
          if (existingUser) {
            setSession(existingSession);
            setUser(existingUser);
          }
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { user: foundUser, session: newSession } = await loginUser(
      email,
      password
    );
    setUser(foundUser);
    setSession(newSession);
  };

  const register = async (email: string, password: string) => {
    const { user: createdUser, session: newSession } = await registerUser(
      email,
      password
    );
    setUser(createdUser);
    setSession(newSession);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setSession(null);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      initializing,
      login,
      register,
      logout,
    }),
    [user, session, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
