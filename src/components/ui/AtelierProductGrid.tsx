"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Check, Plus } from "lucide-react";
import { Product, getAllProducts } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const ATELIER_CATEGORIES = [
  { label: "ALL", slug: "all" },
  { label: "T-SHIRT", slug: "tshirt" },
  { label: "SHIRT", slug: "shirt" },
];

const CURATED_ATELIER_PRODUCTS: Product[] = [
  {
    id: "tailored-poplin-shirt",
    name: "Tailored Poplin Shirt",
    price: 3499,
    description: "Architectural oversized collared shirt in crisp off-white Italian cotton poplin with mother-of-pearl buttons.",
    category_slug: "shirts",
    category_name: "SHIRTS",
    image: "/atelier-shirt.jpg",
    images: ["/atelier-shirt.jpg", "/atelier-shirt-detail.jpg"],
    stock: 22,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "100% Egyptian Cotton Poplin",
    fabric: "Crisp 120s Poplin",
    fit: "Oversized Tailored Drape",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "Charcoal Oxford Overshirt",
    price: 3899,
    description: "Minimalist relaxed collared overshirt crafted from heavyweight Italian structured cotton oxford weave.",
    category_slug: "shirts",
    category_name: "SHIRTS",
    image: "/atelier-oxford-shirt.jpg",
    images: ["/atelier-oxford-shirt.jpg", "/atelier-oxford-detail.jpg"],
    stock: 18,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "100% Italian Oxford Cotton",
    fabric: "Heavyweight Structured Weave",
    fit: "Relaxed Boxy Silhouette",
  },
  {
    id: "oversized-black-tee",
    name: "Heavyweight Boxy Tee",
    price: 2499,
    description: "Architectural drop-shoulder t-shirt cut from 300gsm dense combed cotton jersey.",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/atelier-tshirt.jpg",
    images: ["/atelier-tshirt.jpg", "/atelier-tshirt-detail.jpg"],
    stock: 35,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "100% Combed Heavyweight Cotton",
    fabric: "300gsm Dense Jersey",
    fit: "Boxy Drop-Shoulder",
  },
  {
    id: "minimalist-chalk-tee",
    name: "Minimalist Chalk Tee",
    price: 2499,
    description: "Clean drop-shoulder crewneck t-shirt cut in 320gsm premium off-white combed cotton jersey.",
    category_slug: "t-shirts",
    category_name: "T-SHIRTS",
    image: "/atelier-white-tee.jpg",
    images: ["/atelier-white-tee.jpg", "/atelier-white-detail.jpg"],
    stock: 28,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "100% Combed Heavyweight Cotton",
    fabric: "320gsm Dense Jersey",
    fit: "Relaxed Architectural Fit",
  },
];

export default function AtelierProductGrid() {
  const [products, setProducts] = useState<Product[]>(CURATED_ATELIER_PRODUCTS);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    async function loadCatalog() {
      try {
        const catalog = await getAllProducts();
        if (catalog && catalog.length > 0) {
          // Merge curated atelier items with existing catalog
          const existingIds = new Set(catalog.map((p) => p.id));
          const combined = [
            ...CURATED_ATELIER_PRODUCTS.filter((p) => !existingIds.has(p.id)),
            ...catalog,
          ];
          setProducts(combined);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }
    loadCatalog();

    // Listen to real-time events triggered when products are edited or saved from the Admin Console
    const handleUpdate = () => {
      loadCatalog();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const filteredProducts = products.filter((item) => {
    const slug = (item.category_slug || "").toLowerCase();
    const cat = (item.category_name || "").toLowerCase();
    const title = (item.name || "").toLowerCase();

    const isTshirt =
      slug === "t-shirts" ||
      slug === "tshirts" ||
      slug === "tshirt" ||
      slug.includes("t-shirt") ||
      slug.includes("tshirt") ||
      slug.includes("tee") ||
      cat.includes("t-shirt") ||
      cat.includes("tshirt") ||
      cat.includes("tee") ||
      title.includes("t-shirt") ||
      title.includes("tshirt") ||
      title.includes("tee");

    const isShirt =
      (slug.includes("shirt") || cat.includes("shirt") || title.includes("shirt")) &&
      !isTshirt;

    // Filter out any product that is neither a t-shirt nor a shirt
    if (!isTshirt && !isShirt) return false;

    if (activeTab === "all") return true;
    if (activeTab === "tshirt") return isTshirt;
    if (activeTab === "shirt") return isShirt;
    return false;
  });

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: "M",
    });
    setAddedId(product.id);
    openCart();
    setTimeout(() => {
      setAddedId(null);
    }, 1800);
  };

  const handleWishlistClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category_name || "ATELIER",
    });
  };

  return (
    <section className="atelier-catalog-section" id="catalog">
      <div className="atelier-catalog-wrap">
        {/* Minimalist Header & Filter Tabs */}
        <div className="atelier-filter-bar">
          <div className="atelier-filter-tabs">
            {ATELIER_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                className={`atelier-filter-btn ${activeTab === cat.slug ? "active" : ""}`}
                onClick={() => setActiveTab(cat.slug)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="atelier-catalog-count">
            <span>{filteredProducts.length} ITEMS</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="atelier-grid">
          {filteredProducts.map((product) => {
            const inWishlist = isInWishlist(product.id);
            const materialNote =
              product.material ||
              product.fabric ||
              (product.category_name ? `${product.category_name} &bull; ATELIER` : "Heavyweight Cotton");

            return (
              <div key={product.id} className="atelier-card-wrap">
                <Link href={`/products/${product.id}`} className="atelier-card">
                  {/* Image Frame */}
                  <div className="atelier-image-box">
                    <img
                      src={product.image || "/black-tee.jfif"}
                      alt={product.name}
                      className="atelier-product-img"
                      loading="lazy"
                    />

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      aria-label="Save to Wishlist"
                      className={`atelier-wishlist-btn ${inWishlist ? "active" : ""}`}
                      onClick={(e) => handleWishlistClick(e, product)}
                      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={inWishlist ? "#121212" : "none"}
                        stroke={inWishlist ? "#121212" : "currentColor"}
                      />
                    </button>

                    {/* Add to Cart Photo Button (Permanent Desktop Bar / Mobile Squircle) */}
                    <div className="atelier-quick-add">
                      <button
                        type="button"
                        className={`atelier-quick-btn ${addedId === product.id ? "added" : ""}`}
                        onClick={(e) => handleQuickAdd(e, product)}
                        aria-label={`Add ${product.name} to cart`}
                        title="Add to cart"
                      >
                        {addedId === product.id ? (
                          <>
                            <Check className="atelier-quick-icon check-icon" size={16} strokeWidth={2.6} />
                            <span className="atelier-quick-text">ADDED TO CART</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="atelier-quick-icon desktop-icon" size={15} strokeWidth={2} />
                            <Plus className="atelier-quick-icon mobile-icon" size={19} strokeWidth={2.4} />
                            <span className="atelier-quick-text">ADD TO CART</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Product Details Under Card */}
                  <div className="atelier-details">
                    <div className="atelier-title-row">
                      <h3 className="atelier-product-name">{product.name}</h3>
                      <span className="atelier-product-price">
                        &#8377;{Number(product.price).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p
                      className="atelier-product-sub"
                      dangerouslySetInnerHTML={{ __html: materialNote }}
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
