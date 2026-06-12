import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Svar vid in-/registrering: en feltext, eller null om allt gick bra.
interface AuthResult {
  error: string | null;
}

// Allt resten av appen kan hämta härifrån: info om användaren + in-/utloggningsfunktioner.
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

// "Lådan" som håller inloggningsinfon så alla komponenter kommer åt den – utan att vi skickar runt den.
const AuthContext = createContext<AuthState | null>(null);

// Läggs runt appen. Allt inuti den (children) får tillgång till inloggningsinfon, hur djupt det än ligger.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vid start: är användaren redan inloggad sedan innan?
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Håll sedan koll på in-/utloggningar, så appen alltid visar rätt direkt.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    // Stäng av bevakningen när komponenten försvinner.
    return () => listener.subscription.unsubscribe();
  }, []);

  // Skapar ett nytt konto. Sparar även namnet om det fyllts i.
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

  // Loggar ut den som är inloggad.
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  // Skickar ut allt till komponenterna inuti. user plockas ur sessionen (ingen session = utloggad).
  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Genväg för komponenter att hämta inloggningsinfon.
// Används den utanför AuthProvider kastas ett tydligt fel istället för en kryptisk krasch.
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
