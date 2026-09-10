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

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    name: "T-SHIRTS",
    slug: "t-shirts",
    image: "/black-tee.jfif",
    description: "Signature oversized and regular fit tees designed for timeless streetwear aesthetics.",
  },
  {
    id: "8f4e5a32-9172-466f-b752-2f8e1c6586a0",
    name: "HOODIES",
    slug: "hoodies",
    image: "/grey-hoodie.jfif",
    description: "Heavyweight fleece hoodies with drop shoulders and structured drape.",
  },
  {
    id: "f538723d-7ba4-4dfa-a3d4-bb97281a127c",
    name: "PANTS",
    slug: "pants",
    image: "/cargo-pants.jfif",
    description: "Utility cargo pants and streetwear trousers with tailored proportions.",
  },
  {
    id: "be67b7ca-c601-4daf-9d7d-4ee083f8bdc2",
    name: "CAPS",
    slug: "caps",
    image: "/hero.jfif",
    description: "Low-profile structured 6-panel caps and vintage dad hats.",
  },
  {
    id: "0e60c6fa-3368-4d27-b827-57c2ae2cbcff",
    name: "BAGS",
    slug: "bags",
    image: "/cargo-pants.jfif",
    description: "Technical crossbodies, modular tote bags and utility carriers.",
  },
  {
    id: "21fcf8a3-cdc3-4b43-888e-45a72ef053f2",
    name: "ACCESSORIES",
    slug: "accessories",
    image: "/white-tee.jfif",
    description: "Everyday essentials, keychains, stainless jewelry, and socks.",
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "oversized-black-tee",
    name: "Oversized Black Tee",
    price: 2499,
    description: "A relaxed oversized tee crafted from 240 GSM combed cotton with subtle dropped shoulders.",
    category_id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/black-tee.jfif",
    stock: 50,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "BLACK",
    product_no: "BT-001",
    material: "100% Combed Cotton",
    fabric: "Heavyweight Jersey",
    fit: "Oversized Fit",
  },
  {
    id: "urban-grey-hoodie",
    name: "Urban Grey Hoodie",
    price: 3999,
    description: "A clean heavyweight hoodie built from 420 GSM brushback fleece with hidden pouch pockets.",
    category_id: "8f4e5a32-9172-466f-b752-2f8e1c6586a0",
    category_slug: "hoodies",
    category_name: "HOODIES",
    image: "/grey-hoodie.jfif",
    stock: 45,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "GREY",
    product_no: "GH-001",
    material: "Cotton Fleece",
    fabric: "420 GSM Fleece",
    fit: "Boxy Oversized Fit",
  },
  {
    id: "cargo-street-pants",
    name: "Cargo Street Pants",
    price: 3499,
    description: "Modern streetwear cargo pants with articulated knees, deep utility pockets and cinchable cuffs.",
    category_id: "f538723d-7ba4-4dfa-a3d4-bb97281a127c",
    category_slug: "pants",
    category_name: "PANTS",
    image: "/cargo-pants.jfif",
    stock: 35,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "OLIVE",
    product_no: "GP-001",
    material: "Cotton Twill",
    fabric: "Ripstop Twill",
    fit: "Relaxed Straight Fit",
  },
  {
    id: "classic-white-tee",
    name: "Classic White Tee",
    price: 1999,
    description: "A clean, minimal white tee for daily layering, tailored with reinforced rib collar.",
    category_id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/white-tee.jfif",
    stock: 60,
    is_featured: false,
    is_new: true,
    is_trending: false,
    color: "WHITE",
    product_no: "WT-001",
    material: "100% Organic Cotton",
    fabric: "Single Jersey",
    fit: "Regular Fit",
  },
  {
    id: "greeno-dad-cap",
    name: "GreenO Signature Dad Cap",
    price: 1499,
    description: "Unstructured 6-panel cap with vintage washed cotton finish and antique brass closure.",
    category_id: "be67b7ca-c601-4daf-9d7d-4ee083f8bdc2",
    category_slug: "caps",
    category_name: "CAPS",
    image: "/hero.jfif",
    stock: 25,
    is_featured: false,
    is_new: true,
    is_trending: true,
    color: "BLACK",
    product_no: "CP-001",
    material: "100% Washed Cotton",
    fabric: "Chino Cotton",
    fit: "Adjustable",
  },
  {
    id: "tactical-crossbody-bag",
    name: "Tactical Crossbody Bag",
    price: 2799,
    description: "Water-resistant Cordura nylon body with Fidlock magnetic buckle and modular strap.",
    category_id: "0e60c6fa-3368-4d27-b827-57c2ae2cbcff",
    category_slug: "bags",
    category_name: "BAGS",
    image: "/cargo-pants.jfif",
    stock: 30,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "BLACK",
    product_no: "BG-001",
    material: "Cordura Nylon",
    fabric: "Weatherproof 500D",
    fit: "One Size",
  },
  {
    id: "silver-link-chain",
    name: "Industrial Link Chain",
    price: 1899,
    description: "Solid 316L stainless steel chain with custom GreenO laser engraved clasp.",
    category_id: "21fcf8a3-cdc3-4b43-888e-45a72ef053f2",
    category_slug: "accessories",
    category_name: "ACCESSORIES",
    image: "/white-tee.jfif",
    stock: 40,
    is_featured: false,
    is_new: false,
    is_trending: false,
    color: "SILVER",
    product_no: "AC-001",
    material: "Stainless Steel",
    fabric: "316L Grade",
    fit: "55cm Length",
  },
];

export async function getAllProducts(): Promise<Product[]> {
  try {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.products) && json.products.length > 0) {
            return json.products;
          }
        }
      } catch (clientFetchErr) {
        console.warn("Client fetch /api/products warning, checking local fallbacks:", clientFetchErr);
      }
    }

    if (typeof window === "undefined") {
      try {
        const { getStoreProducts } = await import("./store-data");
        const storeProducts = await getStoreProducts();
        if (storeProducts && storeProducts.length > 0) {
          return storeProducts;
        }
      } catch (serverImportErr) {
        // Continue to Supabase / fallback below
      }
    }

    const supabase = createClient();
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select("*, categories(id, name, slug)");

    if (error || !dbProducts || dbProducts.length === 0) {
      return FALLBACK_PRODUCTS;
    }

    const merged = [...FALLBACK_PRODUCTS];

    dbProducts.forEach((item: any) => {
      const categoryData = Array.isArray(item.categories)
        ? item.categories[0]
        : item.categories;

      const mapped: Product = {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        description: item.description,
        category_id: item.category_id,
        category_slug: categoryData?.slug || undefined,
        category_name: categoryData?.name || undefined,
        collection_tag: item.collection_tag || undefined,
        image: item.image || "/black-tee.jfif",
        stock: item.stock ?? 50,
        size_stock: item.size_stock || undefined,
        is_featured: Boolean(item.is_featured),
        is_new: Boolean(item.is_new),
        is_trending: Boolean(item.is_trending),
        color: item.color || "BLACK",
        colors: Array.isArray(item.colors) ? item.colors : item.color ? [item.color] : ["BLACK"],
        product_no: item.product_no || `GO-${item.id.slice(0, 4)}`,
        material: item.material || "100% Cotton",
        fabric: item.fabric || "Premium Quality",
        fit: item.fit || "Relaxed Fit",
      };

      const existingIndex = merged.findIndex((p) => p.id === mapped.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...mapped };
      } else {
        merged.push(mapped);
      }
    });

    return merged;
  } catch (e) {
    console.error("Error in getAllProducts:", e);
    return FALLBACK_PRODUCTS;
  }
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const products = await getAllProducts();
  const lower = idOrSlug.toLowerCase();

  const found = products.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.name.toLowerCase() === lower.replace(/-/g, " ") ||
      p.id.replace(/-/g, " ").toLowerCase() === lower.replace(/-/g, " ")
  );

  return found || null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await getAllProducts();
  const cleanSlug = categorySlug.toLowerCase().trim();

  return products.filter((p) => {
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
