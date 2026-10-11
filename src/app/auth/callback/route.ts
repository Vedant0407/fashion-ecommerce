import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/account";
  }

  try {
    const url = new URL(value, "https://greeno.invalid");
    if (url.origin !== "https://greeno.invalid") return "/account";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/account";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = safeNextPath(searchParams.get("next") || searchParams.get("redirect"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?authError=oauth", origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, origin));
    }
  } catch (error) {
    console.error("Supabase auth callback error:", error);
  }

  return NextResponse.redirect(new URL("/login?authError=oauth", origin));
}