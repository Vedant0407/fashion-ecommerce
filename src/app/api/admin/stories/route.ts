import { NextRequest, NextResponse } from "next/server";
import {
  getStoreStories,
  saveStoreStory,
  updateStoreStory,
  deleteStoreStory,
} from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const stories = await getStoreStories(false); // all stories for admin
    return NextResponse.json(
      { success: true, stories },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/stories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin stories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, image, caption, link_url, link_text, duration, active, order_index } = body;

    if (!title || !image) {
      return NextResponse.json(
        { success: false, error: "Title and Image URL are required" },
        { status: 400 }
      );
    }

    const newStory = await saveStoreStory({
      title,
      image,
      caption,
      link_url,
      link_text: link_text || "EXPLORE PIECE",
      duration: duration ? Number(duration) : 5,
      active: active !== undefined ? Boolean(active) : true,
      order_index: order_index !== undefined ? Number(order_index) : 0,
    });

    return NextResponse.json({ success: true, story: newStory });
  } catch (error) {
    console.error("POST /api/admin/stories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create story" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Story ID is required" },
        { status: 400 }
      );
    }

    const updated = await updateStoreStory(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, story: updated });
  } catch (error) {
    console.error("PATCH /api/admin/stories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update story" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Story ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteStoreStory(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("DELETE /api/admin/stories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
