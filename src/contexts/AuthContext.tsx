import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Resultatet av en inloggning/registrering: ett felmeddelande, eller null om allt gick bra.
interface AuthResult {
  error: string | null;
}

// Allt som inloggnings-kontexten erbjuder resten av appen (data + funktioner).
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

// Själva kontexten – delar inloggningstillståndet med hela komponentträdet.
const AuthContext = createContext<AuthState | null>(null);

// Wrappern som tillhandahåller inloggningstillståndet till alla barn-komponenter.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vid start: hämta en eventuell befintlig session (om användaren redan var inloggad).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Lyssna sedan på in-/utloggningar så tillståndet hålls uppdaterat i realtid.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    // Städa upp lyssnaren när komponenten tas bort.
    return () => listener.subscription.unsubscribe();
  }, []);

  // Registrerar ett nytt konto. Skickar med namn som metadata om det angetts.
  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: name ? { data: { name } } : undefined,
    });
    return { error: error?.message ?? null };
  };

  // Loggar in med e-post och lösenord.
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // Loggar ut den aktuella användaren.
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  // Gör tillstånd och funktioner tillgängliga för alla barn. user härleds ur sessionen.
  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Genväg som komponenter använder för att läsa inloggningstillståndet.
// Kastar ett fel om den används utanför AuthProvider (vanligt programmeringsmisstag).
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
