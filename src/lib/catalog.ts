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
    image: "/atelier-tshirt.jpg",
    description: "Architectural drop-shoulder t-shirts crafted from heavyweight combed jersey.",
  },
  {
    id: "cat-shirts",
    name: "SHIRTS",
    slug: "shirts",
    image: "/atelier-shirt.jpg",
    description: "Architectural tailored shirting in Italian and Egyptian cotton poplins.",
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "tailored-poplin-shirt",
    name: "Tailored Poplin Shirt",
    price: 3499,
    description: "Architectural oversized collared shirt in crisp off-white Italian cotton poplin with mother-of-pearl buttons.",
    category_id: "cat-shirts",
    category_slug: "shirts",
    category_name: "SHIRTS",
    image: "/atelier-shirt.jpg",
    images: ["/atelier-shirt.jpg", "/atelier-shirt-detail.jpg"],
    stock: 22,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "OFF-WHITE",
    product_no: "AT-SHT-01",
    material: "100% Egyptian Cotton Poplin",
    fabric: "Crisp 120s Poplin",
    fit: "Oversized Tailored Drape",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "Charcoal Oxford Overshirt",
    price: 3899,
    description: "Minimalist relaxed collared overshirt crafted from heavyweight Italian structured cotton oxford weave.",
    category_id: "cat-shirts",
    category_slug: "shirts",
    category_name: "SHIRTS",
    image: "/atelier-oxford-shirt.jpg",
    images: ["/atelier-oxford-shirt.jpg", "/atelier-oxford-detail.jpg"],
    stock: 18,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "CHARCOAL",
    product_no: "AT-SHT-02",
    material: "100% Italian Oxford Cotton",
    fabric: "Heavyweight Structured Weave",
    fit: "Relaxed Boxy Silhouette",
  },
  {
    id: "oversized-black-tee",
    name: "Heavyweight Boxy Tee",
    price: 2499,
    description: "Architectural drop-shoulder t-shirt cut from 300gsm dense combed cotton jersey.",
    category_id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/atelier-tshirt.jpg",
    images: ["/atelier-tshirt.jpg", "/atelier-tshirt-detail.jpg"],
    stock: 35,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "BLACK",
    product_no: "AT-TSH-01",
    material: "100% Combed Heavyweight Cotton",
    fabric: "300gsm Dense Jersey",
    fit: "Boxy Drop-Shoulder",
  },
  {
    id: "minimalist-chalk-tee",
    name: "Minimalist Chalk Tee",
    price: 2499,
    description: "Clean drop-shoulder crewneck t-shirt cut in 320gsm premium off-white combed cotton jersey.",
    category_id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/atelier-white-tee.jpg",
    images: ["/atelier-white-tee.jpg", "/atelier-white-detail.jpg"],
    stock: 28,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "CHALK",
    product_no: "AT-TSH-02",
    material: "100% Combed Heavyweight Cotton",
    fabric: "320gsm Dense Jersey",
    fit: "Relaxed Architectural Fit",
  },
];

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
      let localProducts: Product[] = [];
      try {
        const raw = localStorage.getItem("greeno_store_products");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localProducts = parsed.map(ensureProductImages);
        }
      } catch (localErr) {
        console.warn("Error reading local products:", localErr);
      }

      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const serverProducts: Product[] =
            json.success && Array.isArray(json.products) ? json.products : [];

          // Merge local products and server products seamlessly
          // localProducts (admin created items) MUST BE AT THE FRONT
          const productMap = new Map<string, Product>();
          for (const lp of localProducts) {
            if (lp?.id) productMap.set(lp.id, lp);
          }

          let hadMissingOnServer = false;
          const missingOnServer: Product[] = [];
          const serverIds = new Set(serverProducts.map((p) => p?.id).filter(Boolean));

          for (const lp of localProducts) {
            if (lp?.id && !serverIds.has(lp.id)) {
              missingOnServer.push(lp);
              hadMissingOnServer = true;
            }
          }

          for (const sp of serverProducts) {
            if (sp?.id) {
              if (!productMap.has(sp.id)) {
                productMap.set(sp.id, sp);
              }
            }
          }

          const merged = Array.from(productMap.values());

          // Save merged state back to local cache and cookie bridge
          try {
            localStorage.setItem("greeno_store_products", JSON.stringify(merged));
            document.cookie = `greeno_custom_products=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=31536000; SameSite=Lax`;
          } catch {}

          // Background sync to server if local products were missing
          if (hadMissingOnServer && missingOnServer.length > 0) {
            fetch("/api/admin/products/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ products: missingOnServer }),
            }).catch(() => {});
          }

          if (merged.length > 0) {
            return merged.filter(isShirtOrTshirt).map(ensureProductImages);
          }
        }
      } catch (clientFetchErr) {
        console.warn("Client fetch /api/products warning, using local cache:", clientFetchErr);
        if (localProducts.length > 0) {
          return localProducts.filter(isShirtOrTshirt).map(ensureProductImages);
        }
      }

      if (localProducts.length > 0) {
        return localProducts.filter(isShirtOrTshirt).map(ensureProductImages);
      }
    }

    if (typeof window === "undefined") {
      try {
        const { getStoreProducts } = await import("./store-data");
        const storeProducts = await getStoreProducts();
        if (storeProducts && storeProducts.length > 0) {
          return storeProducts.filter(isShirtOrTshirt).map(ensureProductImages);
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
      return FALLBACK_PRODUCTS.filter(isShirtOrTshirt);
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

    return merged.filter(isShirtOrTshirt).map(ensureProductImages);
  } catch (e) {
    console.error("Error in getAllProducts:", e);
    return FALLBACK_PRODUCTS.filter(isShirtOrTshirt);
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

  // Secondary check against localStorage in case of delay
  if (!found && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("greeno_store_products");
      if (raw) {
        const localList: Product[] = JSON.parse(raw);
        found = localList.find((p) => {
          if (!p || !isShirtOrTshirt(p)) return false;
          const pId = p.id ? String(p.id).toLowerCase() : "";
          const pName = p.name ? String(p.name).toLowerCase() : "";
          return (
            pId === lower ||
            pName === lower.replace(/-/g, " ") ||
            pId.replace(/-/g, " ") === lower.replace(/-/g, " ")
          );
        });
      }
    } catch {}
  }

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
