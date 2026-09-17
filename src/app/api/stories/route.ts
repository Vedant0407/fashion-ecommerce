import { NextRequest, NextResponse } from "next/server";
import { getStoreStories, incrementStoryViews } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const stories = await getStoreStories(true); // active only
    return NextResponse.json(
      { success: true, stories },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storyId } = body;
    if (storyId) {
      await incrementStoryViews(storyId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
