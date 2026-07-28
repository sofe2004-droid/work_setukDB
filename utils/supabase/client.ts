import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createClient() {
  if (!url || !key) throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  return createBrowserClient(url, key);
}
