import { NextResponse } from "next/server";
import { getStoreCategories } from "@/lib/store-data";

export async function GET() {
  try {
    const categories = await getStoreCategories();
    return NextResponse.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error("API /api/categories error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
}
