"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Plus, Check } from "lucide-react";
import { Product, getAllProducts } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const CURATED_NEW_IN: Product[] = [
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
    id: "structured-wool-coat",
    name: "Architectural Wool Overcoat",
    price: 6999,
    description: "Double-faced wool blend overcoat with clean notch lapels and deep welt pockets.",
    category_slug: "outerwear",
    category_name: "OUTERWEAR",
    image: "/atelier-coat.jpg",
    images: ["/atelier-coat.jpg", "/atelier-knitwear.jpg"],
    stock: 12,
    is_featured: true,
    is_new: true,
    is_trending: true,
    material: "80% Virgin Wool, 20% Cashmere",
    fabric: "Double-Faced Melange",
    fit: "Relaxed Architectural Coat",
  },
];

export default function EditorialNewIn() {
  const [products, setProducts] = useState<Product[]>(CURATED_NEW_IN);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    async function load() {
      try {
        const catalog = await getAllProducts();
        if (catalog && catalog.length > 0) {
          const map = new Map<string, Product>();
          for (const p of CURATED_NEW_IN) map.set(p.id, p);
          for (const p of catalog) {
            if (!map.has(p.id)) map.set(p.id, p);
          }
          setProducts(Array.from(map.values()));
        }
      } catch (err) {
        console.warn("Catalog load notice:", err);
      }
    }
    load();
  }, []);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: "M",
      color: product.color || "Noir",
    });

    setAddedId(product.id);
    openCart();
    setTimeout(() => setAddedId(null), 1800);
  };

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category_name || product.category_slug || "Collection",
    });
  };

  const primaryPiece = products[0] || CURATED_NEW_IN[0];
  const sidePieceTop = products[1] || CURATED_NEW_IN[1];
  const sidePieceBottom = products[2] || CURATED_NEW_IN[2];
  const widePiece = products[3] || CURATED_NEW_IN[3];
  const extraPiece = products[4] || CURATED_NEW_IN[4];

  return (
    <section id="new-in" className="editorial-new-in-section">
      <div className="editorial-container">
        {/* Section Header */}
        <div className="editorial-section-header">
          <div className="editorial-header-left">
            <span className="editorial-section-num">01 / LATEST DROP</span>
            <h2 className="editorial-section-heading font-serif">NEW ARRIVALS</h2>
          </div>

          <div className="editorial-header-right">
            <Link href="/shop" className="editorial-view-all-link">
              <span>EXPLORE ALL SILHOUETTES</span>
              <span className="editorial-link-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Asymmetric Magazine Grid */}
        <div className="editorial-asymmetric-grid">
          {/* 1. Large Feature Card (Left Column - Hero Portrait) */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="editorial-grid-item editorial-item-feature"
          >
            <Link
              href={`/products/${primaryPiece.id}`}
              className="editorial-card-link"
            >
              <div className="editorial-card-visual">
                <img
                  src={primaryPiece.image}
                  alt={primaryPiece.name}
                  className="editorial-primary-img"
                  loading="eager"
                />
                {primaryPiece.images && primaryPiece.images[1] && (
                  <img
                    src={primaryPiece.images[1]}
                    alt={`${primaryPiece.name} detail`}
                    className="editorial-secondary-img"
                    loading="lazy"
                  />
                )}

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => handleWishlistToggle(e, primaryPiece)}
                  className={`editorial-card-wishlist ${
                    isInWishlist(primaryPiece.id) ? "active" : ""
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart size={15} strokeWidth={1.8} fill={isInWishlist(primaryPiece.id) ? "currentColor" : "none"} />
                </button>

                {/* Quick Add Pill */}
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, primaryPiece)}
                  className="editorial-card-quick-add"
                  aria-label="Quick add to bag"
                >
                  {addedId === primaryPiece.id ? (
                    <>
                      <Check size={13} strokeWidth={2.5} />
                      <span>ADDED</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} strokeWidth={2.2} />
                      <span>ADD TO BAG</span>
                    </>
                  )}
                </button>
              </div>

              {/* Minimal Editorial Meta */}
              <div className="editorial-card-meta">
                <div className="editorial-meta-info">
                  <span className="editorial-meta-category">
                    {primaryPiece.category_name || "SHIRTING"}
                  </span>
                  <h3 className="editorial-meta-title">{primaryPiece.name}</h3>
                </div>
                <span className="editorial-meta-price">
                  ₹{primaryPiece.price.toLocaleString("en-IN")}
                </span>
              </div>
            </Link>
          </motion.div>

          {/* 2. Right Column - 2 Stacked Asymmetrical Cards */}
          <div className="editorial-grid-stack">
            {/* Top Right Card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-grid-item editorial-item-medium"
            >
              <Link
                href={`/products/${sidePieceTop.id}`}
                className="editorial-card-link"
              >
                <div className="editorial-card-visual">
                  <img
                    src={sidePieceTop.image}
                    alt={sidePieceTop.name}
                    className="editorial-primary-img"
                    loading="lazy"
                  />
                  {sidePieceTop.images && sidePieceTop.images[1] && (
                    <img
                      src={sidePieceTop.images[1]}
                      alt={`${sidePieceTop.name} detail`}
                      className="editorial-secondary-img"
                      loading="lazy"
                    />
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleWishlistToggle(e, sidePieceTop)}
                    className={`editorial-card-wishlist ${
                      isInWishlist(sidePieceTop.id) ? "active" : ""
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={15} strokeWidth={1.8} fill={isInWishlist(sidePieceTop.id) ? "currentColor" : "none"} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, sidePieceTop)}
                    className="editorial-card-quick-add"
                    aria-label="Quick add to bag"
                  >
                    {addedId === sidePieceTop.id ? (
                      <>
                        <Check size={13} strokeWidth={2.5} />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} strokeWidth={2.2} />
                        <span>ADD TO BAG</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="editorial-card-meta">
                  <div className="editorial-meta-info">
                    <span className="editorial-meta-category">
                      {sidePieceTop.category_name || "JERSEY"}
                    </span>
                    <h3 className="editorial-meta-title">{sidePieceTop.name}</h3>
                  </div>
                  <span className="editorial-meta-price">
                    ₹{sidePieceTop.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Bottom Right Card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-grid-item editorial-item-medium"
            >
              <Link
                href={`/products/${sidePieceBottom.id}`}
                className="editorial-card-link"
              >
                <div className="editorial-card-visual">
                  <img
                    src={sidePieceBottom.image}
                    alt={sidePieceBottom.name}
                    className="editorial-primary-img"
                    loading="lazy"
                  />
                  {sidePieceBottom.images && sidePieceBottom.images[1] && (
                    <img
                      src={sidePieceBottom.images[1]}
                      alt={`${sidePieceBottom.name} detail`}
                      className="editorial-secondary-img"
                      loading="lazy"
                    />
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleWishlistToggle(e, sidePieceBottom)}
                    className={`editorial-card-wishlist ${
                      isInWishlist(sidePieceBottom.id) ? "active" : ""
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={15} strokeWidth={1.8} fill={isInWishlist(sidePieceBottom.id) ? "currentColor" : "none"} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, sidePieceBottom)}
                    className="editorial-card-quick-add"
                    aria-label="Quick add to bag"
                  >
                    {addedId === sidePieceBottom.id ? (
                      <>
                        <Check size={13} strokeWidth={2.5} />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} strokeWidth={2.2} />
                        <span>ADD TO BAG</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="editorial-card-meta">
                  <div className="editorial-meta-info">
                    <span className="editorial-meta-category">
                      {sidePieceBottom.category_name || "OVERSHIRT"}
                    </span>
                    <h3 className="editorial-meta-title">{sidePieceBottom.name}</h3>
                  </div>
                  <span className="editorial-meta-price">
                    ₹{sidePieceBottom.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Panoramic Bottom Showcase (Magazine Hero Spread) */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="editorial-panoramic-spread"
        >
          <div className="editorial-panoramic-item">
            <Link
              href={`/products/${widePiece.id}`}
              className="editorial-panoramic-link"
            >
              <div className="editorial-panoramic-visual">
                <img
                  src={widePiece.image}
                  alt={widePiece.name}
                  className="editorial-panoramic-img"
                  loading="lazy"
                />
                <div className="editorial-panoramic-overlay" />

                <div className="editorial-panoramic-caption">
                  <span className="editorial-panoramic-tag">HEAVYWEIGHT ARCHIVE</span>
                  <h4 className="editorial-panoramic-title font-serif">{widePiece.name}</h4>
                  <p className="editorial-panoramic-desc">
                    300gsm dense combed cotton jersey with an architectural drop-shoulder drape.
                  </p>
                  <span className="editorial-panoramic-action">
                    DISCOVER PIECE — ₹{widePiece.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {extraPiece && (
            <div className="editorial-panoramic-item editorial-panoramic-secondary">
              <Link
                href={`/products/${extraPiece.id}`}
                className="editorial-panoramic-link"
              >
                <div className="editorial-panoramic-visual">
                  <img
                    src={extraPiece.image}
                    alt={extraPiece.name}
                    className="editorial-panoramic-img"
                    loading="lazy"
                  />
                  <div className="editorial-panoramic-overlay" />

                  <div className="editorial-panoramic-caption">
                    <span className="editorial-panoramic-tag">LIMITED TAILORING</span>
                    <h4 className="editorial-panoramic-title font-serif">{extraPiece.name}</h4>
                    <p className="editorial-panoramic-desc">
                      Crafted from heavyweight virgin wool blend with structured shoulder silhouette.
                    </p>
                    <span className="editorial-panoramic-action">
                      DISCOVER PIECE — ₹{extraPiece.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
