import { NextRequest, NextResponse } from "next/server";
import { getAllSafeUsers, getTotalUsersCount } from "@/lib/user-store";

export async function GET(request: NextRequest) {
  try {
    const users = await getAllSafeUsers();
    const count = await getTotalUsersCount();

    return NextResponse.json({
      success: true,
      count,
      users,
    });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
