import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://pxzwrwzkiljeqagsyeom.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_Qkrxh2RDBlbuEGzOqRNVgw_IZwVH6Q0";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

  return createBrowserClient(url, key);
}