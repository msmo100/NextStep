import { createClient } from '@supabase/supabase-js';

// Läs in adress och nyckel till Supabase (databas + inloggning) från miljövariablerna.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sant bara om båda miljövariablerna är satta – används för att visa hjälpsamma fel.
export const isSupabaseConfigured = Boolean(url && anonKey);

// Varna i konsolen om uppsättningen saknas, så att felet blir lätt att förstå.
if (!isSupabaseConfigured) {
  console.warn(
    'NextStep: Supabase är inte konfigurerat. Sätt VITE_SUPABASE_URL och ' +
      'VITE_SUPABASE_ANON_KEY i .env.local (se README).'
  );
}

// Den delade Supabase-klienten som resten av appen använder.
// Faller tillbaka på platshållarvärden om konfigurationen saknas (så appen inte kraschar).
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key'
);
