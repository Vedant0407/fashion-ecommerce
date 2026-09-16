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
  {
    id: "cat-tops",
    name: "TOPS",
    slug: "tops",
    image: "/atelier-knitwear.jpg",
    description: "Fine knitwear, minimal tees, and structured shirting.",
  },
  {
    id: "cat-outerwear",
    name: "OUTERWEAR",
    slug: "outerwear",
    image: "/atelier-coat.jpg",
    description: "Tailored long coats, architectural blazers, and luxury woolens.",
  },
  {
    id: "cat-footwear",
    name: "FOOTWEAR",
    slug: "footwear",
    image: "/atelier-derbies.jpg",
    description: "Hand-finished calfskin derbies and European leather shoes.",
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "envelope-tote-bag",
    name: "Envelope Tote",
    price: 4499,
    description: "Architectural slouchy shoulder tote crafted from vegetable-tanned full-grain calfskin leather.",
    category_id: "0e60c6fa-3368-4d27-b827-57c2ae2cbcff",
    category_slug: "bags",
    category_name: "BAGS",
    image: "/atelier-bag.jpg",
    images: ["/atelier-bag.jpg", "/atelier-bag-detail.jpg"],
    stock: 20,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "NOIR",
    product_no: "AT-BAG-01",
    material: "Calfskin Leather",
    fabric: "Vegetable Tanned",
    fit: "Structured slouch",
  },
  {
    id: "knit-turtleneck-no-3",
    name: "Knit Turtleneck No. 3",
    price: 3899,
    description: "Relaxed high-neck sweater knitted from 100% fine virgin wool in an oatmeal ribbed texture.",
    category_id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    category_slug: "tops",
    category_name: "TOPS",
    image: "/atelier-knitwear.jpg",
    images: ["/atelier-knitwear.jpg", "/white-tee.jfif"],
    stock: 30,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "OATMEAL",
    product_no: "AT-KNIT-03",
    material: "100% Virgin wool",
    fabric: "Heavyweight rib",
    fit: "Relaxed drape",
  },
  {
    id: "polished-calfskin-derbies",
    name: "Calfskin Derbies",
    price: 5299,
    description: "Minimalist low-profile derby shoes shaped from polished black calfskin with hand-finished leather soles.",
    category_id: "21fcf8a3-cdc3-4b43-888e-45a72ef053f2",
    category_slug: "footwear",
    category_name: "FOOTWEAR",
    image: "/atelier-derbies.jpg",
    images: ["/atelier-derbies.jpg"],
    stock: 18,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "NOIR",
    product_no: "AT-SHOE-01",
    material: "Polished calfskin",
    fabric: "Leather sole",
    fit: "Classic European",
  },
  {
    id: "tailored-wool-coat",
    name: "Double-Breasted Wool Coat",
    price: 6999,
    description: "Sharp architectural double-breasted long coat in heavyweight charcoal melange wool.",
    category_id: "8f4e5a32-9172-466f-b752-2f8e1c6586a0",
    category_slug: "outerwear",
    category_name: "OUTERWEAR",
    image: "/atelier-coat.jpg",
    images: ["/atelier-coat.jpg", "/grey-hoodie.jfif"],
    stock: 15,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "CHARCOAL",
    product_no: "AT-COAT-01",
    material: "Heavyweight wool melange",
    fabric: "Satin lining",
    fit: "Tailored silhouette",
  },
  {
    id: "pleated-wool-trousers",
    name: "Pleated Wool Trousers",
    price: 4299,
    description: "Architectural wide-leg tailored trousers in tropical virgin wool with double front pleats and fluid drape.",
    category_id: "f538723d-7ba4-4dfa-a3d4-bb97281a127c",
    category_slug: "pants",
    category_name: "PANTS",
    image: "/atelier-trousers.jpg",
    images: ["/atelier-trousers.jpg", "/atelier-trousers-detail.jpg"],
    stock: 25,
    is_featured: true,
    is_new: true,
    is_trending: true,
    color: "CHARCOAL",
    product_no: "AT-PNT-01",
    material: "100% Tropical Wool",
    fabric: "Virgin Wool Weave",
    fit: "Relaxed Wide Leg",
  },
  {
    id: "oversized-black-tee",
    name: "Oversized Black Tee",
    price: 2499,
    description: "A relaxed oversized tee crafted from 240 GSM combed cotton with subtle dropped shoulders.",
    category_id: "6ddd1a2e-ccc1-4e2d-8f34-d406a13dd54c",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/black-tee.jfif",
    images: ["/black-tee.jfif", "/white-tee.jfif", "/grey-hoodie.jfif"],
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
    images: ["/grey-hoodie.jfif", "/black-tee.jfif", "/hero.jfif"],
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
    images: ["/cargo-pants.jfif", "/grey-hoodie.jfif", "/black-tee.jfif"],
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
    images: ["/white-tee.jfif", "/black-tee.jfif", "/hero.jfif"],
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
    images: ["/hero.jfif", "/black-tee.jfif", "/white-tee.jfif"],
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
    images: ["/cargo-pants.jfif", "/black-tee.jfif", "/grey-hoodie.jfif"],
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
    images: ["/white-tee.jfif", "/hero.jfif"],
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
            return merged.map(ensureProductImages);
          }
        }
      } catch (clientFetchErr) {
        console.warn("Client fetch /api/products warning, using local cache:", clientFetchErr);
        if (localProducts.length > 0) {
          return localProducts.map(ensureProductImages);
        }
      }

      if (localProducts.length > 0) {
        return localProducts.map(ensureProductImages);
      }
    }

    if (typeof window === "undefined") {
      try {
        const { getStoreProducts } = await import("./store-data");
        const storeProducts = await getStoreProducts();
        if (storeProducts && storeProducts.length > 0) {
          return storeProducts.map(ensureProductImages);
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

    return merged.map(ensureProductImages);
  } catch (e) {
    console.error("Error in getAllProducts:", e);
    return FALLBACK_PRODUCTS;
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
          if (!p) return false;
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
    if ((cleanSlug === "newin" || cleanSlug === "new-in" || cleanSlug === "new") && p.is_new) return true;
    if (cleanSlug === "trending" && p.is_trending) return true;
    if (cleanSlug === "featured" && p.is_featured) return true;
    if (p.collection_tag?.toLowerCase() === cleanSlug) return true;
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
