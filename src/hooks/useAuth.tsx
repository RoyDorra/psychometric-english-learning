import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { bootstrap } from "../core/bootstrap";
import { supabase } from "../services/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    (async () => {
      try {
        await bootstrap();
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (!active) {
          return;
        }
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.warn("Failed to restore auth session", error);
        if (active) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    setSession(data.session ?? null);
    setUser(data.user ?? data.session?.user ?? null);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    setSession(data.session ?? null);
    setUser(data.user ?? data.session?.user ?? null);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, session, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
