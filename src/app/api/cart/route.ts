import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const CARTS_FILE = path.join(DATA_DIR, "carts.json");

type UserCartRecord = {
  cart: any[];
  coupon?: any | null;
  updatedAt?: string;
};

function ensureCartsFile(): Record<string, UserCartRecord> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CARTS_FILE)) {
      fs.writeFileSync(CARTS_FILE, JSON.stringify({}), "utf-8");
      return {};
    }
    const raw = fs.readFileSync(CARTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCarts(data: Record<string, UserCartRecord>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CARTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write carts.json:", err);
  }
}

// GET /api/cart?email=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !email.trim().includes("@")) {
      return NextResponse.json({ success: true, cart: [], coupon: null });
    }

    const cleanEmail = email.trim().toLowerCase();
    const carts = ensureCartsFile();
    const userRecord = carts[cleanEmail] || { cart: [], coupon: null };

    return NextResponse.json({
      success: true,
      cart: userRecord.cart || [],
      coupon: userRecord.coupon || null,
    });
  } catch (error: any) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load cart." },
      { status: 500 }
    );
  }
}

// POST /api/cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, cart, coupon } = body;

    if (!email || typeof email !== "string" || !email.trim().includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid email is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(cart)) {
      return NextResponse.json(
        { success: false, message: "Cart must be an array." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const carts = ensureCartsFile();
    carts[cleanEmail] = {
      cart,
      coupon: coupon || null,
      updatedAt: new Date().toISOString(),
    };
    saveCarts(carts);

    return NextResponse.json({
      success: true,
      message: "Cart saved successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save cart." },
      { status: 500 }
    );
  }
}
