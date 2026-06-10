import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'NextStep: Supabase är inte konfigurerat. Sätt VITE_SUPABASE_URL och ' +
      'VITE_SUPABASE_ANON_KEY i .env.local (se README).'
  );
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key'
);
