import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when both Supabase env vars are present. The UI uses this to show a
 * setup hint instead of failing silently when the app isn't configured yet.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'NextStep: Supabase är inte konfigurerat. Sätt VITE_SUPABASE_URL och ' +
      'VITE_SUPABASE_ANON_KEY i .env.local (se README).'
  );
}

// Fall back to harmless placeholders so createClient doesn't throw at import
// time when env vars are missing — real calls are gated behind isSupabaseConfigured.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key'
);
