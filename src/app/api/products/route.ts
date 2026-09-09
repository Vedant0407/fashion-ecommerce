import { NextRequest, NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");
    const sort = searchParams.get("sort");
    const featured = searchParams.get("featured");
    const trending = searchParams.get("trending");

    let products = await getStoreProducts();

    if (category && category.toLowerCase() !== "all") {
      const cleanSlug = category.toLowerCase().trim();
      products = products.filter((p) => {
        if (p.category_slug?.toLowerCase() === cleanSlug) return true;
        if (p.category_name?.toLowerCase().replace(/[\s-]/g, "") === cleanSlug.replace(/[\s-]/g, "")) return true;
        if (cleanSlug === "t-shirts" && (p.id.includes("tee") || p.name.toLowerCase().includes("tee"))) return true;
        if (cleanSlug === "hoodies" && (p.id.includes("hoodie") || p.name.toLowerCase().includes("hoodie"))) return true;
        if (cleanSlug === "pants" && (p.id.includes("pants") || p.name.toLowerCase().includes("pants") || p.id.includes("cargo"))) return true;
        if (cleanSlug === "caps" && (p.id.includes("cap") || p.name.toLowerCase().includes("cap"))) return true;
        if (cleanSlug === "bags" && (p.id.includes("bag") || p.name.toLowerCase().includes("bag"))) return true;
        if (cleanSlug === "accessories" && (p.id.includes("chain") || p.name.toLowerCase().includes("chain"))) return true;
        return false;
      });
    }

    if (query) {
      const q = query.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category_name && p.category_name.toLowerCase().includes(q)) ||
          (p.color && p.color.toLowerCase().includes(q))
      );
    }

    if (featured === "true") {
      products = products.filter((p) => p.is_featured);
    }

    if (trending === "true") {
      products = products.filter((p) => p.is_trending);
    }

    if (sort === "price-asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("API /api/products error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
