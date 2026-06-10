import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Svaret vi får tillbaka när någon loggar in eller registrerar sig.
// error = en text med vad som gick fel. Är den null gick allt bra.
interface AuthResult {
  error: string | null;
}

// Listan över allt som resten av appen kan hämta härifrån:
// information om användaren (user, session, loading) och knappfunktioner
// för att registrera sig, logga in och logga ut.
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

// Själva "lådan" som håller inloggningsinfon så att alla komponenter i appen
// kan komma åt den, utan att vi behöver skicka den manuellt från sida till sida.
const AuthContext = createContext<AuthState | null>(null);

// Komponenten du lägger runt appen. Allt som ligger inuti den (children) –
// alla sidor och komponenter, hur djupt nästlade de än är – får tillgång till inloggningsinfon.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // När appen startar: kolla om användaren redan är inloggad sedan tidigare.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Bevaka sedan löpande när någon loggar in eller ut, så att appen
    // alltid visar rätt status direkt – utan att sidan behöver laddas om.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    // Stäng av bevakningen när komponenten försvinner, så inget ligger kvar i bakgrunden.
    return () => listener.subscription.unsubscribe();
  }, []);

  // Skapar ett nytt konto med e-post och lösenord.
  // Om ett namn har angetts sparas det också på kontot.
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

  // Loggar in en befintlig användare med e-post och lösenord.
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // Loggar ut användaren som är inloggad just nu.
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  // Skickar ut all info och alla funktioner till komponenterna inuti appen.
  // user plockas ut ur sessionen (finns ingen session är ingen inloggad = null).
  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Liten hjälpfunktion som komponenter anropar för att komma åt inloggningsinfon.
// Glömmer man att lägga komponenten inuti AuthProvider finns ingen info att hämta,
// och då kastas ett tydligt fel istället för att appen kraschar på ett svårförståeligt sätt.
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
