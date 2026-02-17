import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let client: SupabaseClient | null = null;

function getEnvValue(key: string) {
  return (import.meta.env[key] as string | undefined)?.trim();
}

function readConfig(): SupabaseConfig | null {
  const url = getEnvValue('VITE_SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = getEnvValue('VITE_SUPABASE_ANON_KEY');

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseClient() {
  if (client) return client;

  const config = readConfig();
  if (!config) return null;

  client = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      flowType: 'pkce',
    },
  });

  return client;
}

export function hasSupabaseConfig() {
  return readConfig() !== null;
}

