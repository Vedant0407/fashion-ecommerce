import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSession();
  if (session.response) return session.response;
  return NextResponse.json(
    {
      success: true,
      admin: true,
      user: {
        id: session.user?.id,
        email: session.user?.email,
        name:
          session.user?.user_metadata?.full_name ||
          session.user?.user_metadata?.name ||
          session.user?.email?.split("@")[0] ||
          "",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
