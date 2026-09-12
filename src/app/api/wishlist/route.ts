import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const WISHLISTS_FILE = path.join(DATA_DIR, "wishlists.json");

function ensureWishlistsFile(): Record<string, any[]> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(WISHLISTS_FILE)) {
      fs.writeFileSync(WISHLISTS_FILE, JSON.stringify({}), "utf-8");
      return {};
    }
    const raw = fs.readFileSync(WISHLISTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveWishlists(data: Record<string, any[]>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WISHLISTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write wishlists.json:", err);
  }
}

// GET /api/wishlist?email=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !email.trim().includes("@")) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    const cleanEmail = email.trim().toLowerCase();
    const wishlists = ensureWishlistsFile();
    const userWishlist = wishlists[cleanEmail] || [];

    return NextResponse.json({
      success: true,
      wishlist: userWishlist,
    });
  } catch (error: any) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load wishlist." },
      { status: 500 }
    );
  }
}

// POST /api/wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, wishlist } = body;

    if (!email || typeof email !== "string" || !email.trim().includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid email is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(wishlist)) {
      return NextResponse.json(
        { success: false, message: "Wishlist must be an array." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const wishlists = ensureWishlistsFile();
    wishlists[cleanEmail] = wishlist;
    saveWishlists(wishlists);

    return NextResponse.json({
      success: true,
      message: "Wishlist saved successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save wishlist." },
      { status: 500 }
    );
  }
}
