"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Product, getAllProducts } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const ATELIER_CATEGORIES = [
  { label: "ALL", slug: "all" },
  { label: "PANTS", slug: "pants" },
  { label: "TOPS", slug: "tops" },
  { label: "OUTERWEAR", slug: "outerwear" },
  { label: "BAGS", slug: "bags" },
  { label: "FOOTWEAR", slug: "footwear" },
];

const CURATED_ATELIER_PRODUCTS: Product[] = [
  {
    id: "envelope-tote-bag",
    name: "Envelope Tote",
    price: 4499,
    description: "Architectural slouchy shoulder tote crafted from vegetable-tanned full-grain calfskin leather.",
    category_slug: "bags",
    category_name: "BAGS",
    image: "/atelier-bag.jpg",
    images: ["/atelier-bag.jpg"],
    stock: 20,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "Vegetable tanned calfskin",
    fabric: "Full grain leather",
    fit: "Structured slouch",
  },
  {
    id: "knit-turtleneck-no-3",
    name: "Knit Turtleneck No. 3",
    price: 3899,
    description: "Relaxed high-neck sweater knitted from 100% fine virgin wool in an oatmeal ribbed texture.",
    category_slug: "tops",
    category_name: "TOPS",
    image: "/atelier-knitwear.jpg",
    images: ["/atelier-knitwear.jpg"],
    stock: 30,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "100% Virgin wool",
    fabric: "Heavyweight rib",
    fit: "Relaxed drape",
  },
  {
    id: "pleated-wool-trousers",
    name: "Pleated Wool Trousers",
    price: 4299,
    description: "Architectural wide-leg tailored trousers in tropical virgin wool with double front pleats and fluid drape.",
    category_slug: "pants",
    category_name: "PANTS",
    image: "/atelier-trousers.jpg",
    images: ["/atelier-trousers.jpg", "/atelier-trousers-detail.jpg"],
    stock: 25,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "100% Tropical Wool",
    fabric: "Virgin Wool Weave",
    fit: "Relaxed Wide Leg",
  },
  {
    id: "polished-calfskin-derbies",
    name: "Calfskin Derbies",
    price: 5299,
    description: "Minimalist low-profile derby shoes shaped from polished black calfskin with hand-finished leather soles.",
    category_slug: "footwear",
    category_name: "FOOTWEAR",
    image: "/atelier-derbies.jpg",
    images: ["/atelier-derbies.jpg"],
    stock: 18,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "Polished calfskin",
    fabric: "Leather sole",
    fit: "Classic European",
  },
  {
    id: "tailored-wool-coat",
    name: "Double-Breasted Wool Coat",
    price: 6999,
    description: "Sharp architectural double-breasted long coat in heavyweight charcoal melange wool.",
    category_slug: "outerwear",
    category_name: "OUTERWEAR",
    image: "/atelier-coat.jpg",
    images: ["/atelier-coat.jpg"],
    stock: 15,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "Heavyweight wool melange",
    fabric: "Satin lining",
    fit: "Tailored silhouette",
  },
];

export default function AtelierProductGrid() {
  const [products, setProducts] = useState<Product[]>(CURATED_ATELIER_PRODUCTS);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
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
    if (activeTab === "all") return true;
    const slug = (item.category_slug || "").toLowerCase();
    const cat = (item.category_name || "").toLowerCase();
    const title = (item.name || "").toLowerCase();

    if (activeTab === "pants") {
      return (
        slug === "pants" ||
        slug.includes("pant") ||
        slug.includes("trouser") ||
        cat.includes("pant") ||
        cat.includes("trouser") ||
        title.includes("pant") ||
        title.includes("trouser") ||
        title.includes("cargo")
      );
    }
    if (activeTab === "tops") {
      return (
        slug.includes("top") ||
        slug.includes("tee") ||
        slug.includes("shirt") ||
        cat.includes("top") ||
        cat.includes("tee") ||
        cat.includes("shirt") ||
        title.includes("tee") ||
        title.includes("turtleneck")
      );
    }
    if (activeTab === "outerwear") {
      return (
        slug.includes("outer") ||
        slug.includes("hoodie") ||
        slug.includes("coat") ||
        cat.includes("outer") ||
        cat.includes("hoodie") ||
        title.includes("coat") ||
        title.includes("jacket") ||
        title.includes("hoodie")
      );
    }
    if (activeTab === "bags") {
      return (
        slug.includes("bag") ||
        cat.includes("bag") ||
        title.includes("bag") ||
        title.includes("tote")
      );
    }
    if (activeTab === "footwear") {
      return (
        slug.includes("foot") ||
        slug.includes("shoe") ||
        cat.includes("foot") ||
        cat.includes("shoe") ||
        title.includes("derb") ||
        title.includes("shoe")
      );
    }
    return slug === activeTab || cat === activeTab || title.includes(activeTab);
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
    openCart();
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

                    {/* Quick Add Overlay */}
                    <div className="atelier-quick-add">
                      <button
                        type="button"
                        className="atelier-quick-btn"
                        onClick={(e) => handleQuickAdd(e, product)}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>QUICK ADD</span>
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
