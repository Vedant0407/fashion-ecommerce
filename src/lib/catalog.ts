import { createClient } from "@/lib/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  category_id?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  collection_tag?: string | null;
  image: string;
  images?: string[];
  stock?: number | null;
  size_stock?: Record<string, number>;
  is_featured?: boolean;
  is_new?: boolean;
  is_trending?: boolean;
  color?: string | null;
  colors?: string[];
  product_no?: string | null;
  material?: string | null;
  fabric?: string | null;
  fit?: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
};

export const FALLBACK_CATEGORIES: Category[] = [];

export const FALLBACK_PRODUCTS: Product[] = [];

export function ensureProductImages(product: Product): Product {
  const fallback = FALLBACK_PRODUCTS.find((p) => p.id === product.id);
  if (fallback?.images && fallback.images.length > 1) {
    return {
      ...product,
      images: fallback.images,
    };
  }

  if (Array.isArray(product.images) && product.images.length > 1) {
    return product;
  }

  const baseImg = product.image || "/black-tee.jfif";
  const cat = (
    product.category_name ||
    product.category_slug ||
    product.name ||
    ""
  ).toLowerCase();

  let pool: string[];
  if (cat.includes("tee") || cat.includes("t-shirt") || cat.includes("shirt")) {
    pool = [baseImg, "/white-tee.jfif", "/grey-hoodie.jfif", "/hero.jfif"];
  } else if (cat.includes("hoodie") || cat.includes("sweat")) {
    pool = [baseImg, "/black-tee.jfif", "/hero.jfif", "/white-tee.jfif"];
  } else if (cat.includes("pant") || cat.includes("cargo") || cat.includes("trouser")) {
    pool = [baseImg, "/grey-hoodie.jfif", "/black-tee.jfif"];
  } else if (cat.includes("cap") || cat.includes("hat")) {
    pool = [baseImg, "/black-tee.jfif", "/white-tee.jfif"];
  } else if (cat.includes("bag") || cat.includes("crossbody")) {
    pool = [baseImg, "/cargo-pants.jfif", "/black-tee.jfif"];
  } else {
    pool = [baseImg, "/white-tee.jfif", "/black-tee.jfif", "/grey-hoodie.jfif"];
  }

  const unique = pool.filter((img, idx, arr) => arr.indexOf(img) === idx);
  return {
    ...product,
    images: unique.length > 1 ? unique : [baseImg, "/black-tee.jfif", "/white-tee.jfif"],
  };
}

export function isShirtOrTshirt(product?: Product | null): boolean {
  if (!product) return false;
  const id = (product.id || "").toLowerCase();
  const catSlug = (product.category_slug || "").toLowerCase();
  const catName = (product.category_name || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // Exclude non-shirt categories and product lines
  if (
    id.includes("pant") ||
    id.includes("trouser") ||
    id.includes("hoodie") ||
    id.includes("bag") ||
    id.includes("cap") ||
    id.includes("derbie") ||
    id.includes("chain") ||
    id.includes("coat") ||
    id.includes("knit") ||
    name.includes("trouser") ||
    name.includes("bag") ||
    name.includes("cap") ||
    name.includes("hoodie") ||
    name.includes("pant") ||
    name.includes("derbie") ||
    name.includes("coat") ||
    name.includes("turtleneck") ||
    name.includes("chain")
  ) {
    return false;
  }

  return (
    catSlug.includes("shirt") ||
    catSlug.includes("tee") ||
    catName.includes("shirt") ||
    catName.includes("tee") ||
    name.includes("shirt") ||
    name.includes("tee") ||
    id.includes("shirt") ||
    id.includes("tee")
  );
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    if (typeof window !== "undefined") {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.products) ? data.products.filter(isShirtOrTshirt).map(ensureProductImages) : [];
    }
    const { getStoreProducts } = await import("./store-data");
    const products = await getStoreProducts();
    return products.filter(isShirtOrTshirt).map(ensureProductImages);
  } catch (error) {
    console.error("Unable to load products from the store database:", error);
    return [];
  }
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  if (!idOrSlug) return null;
  const products = await getAllProducts();
  const lower = String(idOrSlug).toLowerCase().trim();

  let found = products.find((p) => {
    if (!p) return false;
    const pId = p.id ? String(p.id).toLowerCase() : "";
    const pName = p.name ? String(p.name).toLowerCase() : "";
    return (
      pId === lower ||
      pName === lower.replace(/-/g, " ") ||
      pId.replace(/-/g, " ") === lower.replace(/-/g, " ")
    );
  });

  return found || null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await getAllProducts();
  const cleanSlug = categorySlug.toLowerCase().trim();

  return products.filter((p) => {
    if (!isShirtOrTshirt(p)) return false;
    if ((cleanSlug === "newin" || cleanSlug === "new-in" || cleanSlug === "new") && p.is_new) return true;
    if (cleanSlug === "trending" && p.is_trending) return true;
    if (cleanSlug === "featured" && p.is_featured) return true;
    if (p.collection_tag?.toLowerCase() === cleanSlug) return true;
    if (p.category_slug?.toLowerCase() === cleanSlug) return true;
    if (p.category_name?.toLowerCase().replace(/[\s-]/g, "") === cleanSlug.replace(/[\s-]/g, "")) return true;

    if (cleanSlug === "t-shirts" && (p.id.includes("tee") || p.name.toLowerCase().includes("tee") || p.category_slug === "t-shirts")) return true;
    if (cleanSlug === "shirts" && (p.id.includes("shirt") || p.name.toLowerCase().includes("shirt") || p.category_slug === "shirts")) return true;

    return false;
  });
}
