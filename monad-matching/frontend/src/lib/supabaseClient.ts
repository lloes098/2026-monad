import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let lastCredentials = "";

/**
 * 환경 변수가 없으면 null — 목업 채팅만 사용.
 * URL/키가 바뀌면 클라이언트를 다시 만듦 (dev에서 .env 추가 후 HMR 대비).
 */
export function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anon) {
    client = null;
    lastCredentials = "";
    return null;
  }
  const key = `${url}\n${anon}`;
  if (!client || lastCredentials !== key) {
    client = createClient(url, anon);
    lastCredentials = key;
  }
  return client;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}
