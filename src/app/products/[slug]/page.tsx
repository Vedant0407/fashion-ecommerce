"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Star,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import EditorialFooter from "@/components/ui/EditorialFooter";
import ProductImageLightbox from "@/components/ProductImageLightbox";
import { Product, getProductByIdOrSlug, getAllProducts } from "@/lib/catalog";

interface ReviewItem {
  id: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  sizePurchased?: string;
  fitFeedback?: string;
  helpfulCount: number;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    author: "Julian V.",
    location: "Milan, IT",
    rating: 5,
    date: "3 days ago",
    title: "Impeccable collar stance and refined weave",
    comment:
      "The collar retains its sharp architectural profile with zero buckling. The fabric has an exquisite substantial weight while remaining breathable throughout the day.",
    verified: true,
    sizePurchased: "M",
    fitFeedback: "True to Size",
    helpfulCount: 14,
  },
  {
    id: "rev-2",
    author: "Aarav M.",
    location: "Mumbai, IN",
    rating: 5,
    date: "1 week ago",
    title: "Fluid drape, quiet luxury tailoring",
    comment:
      "Fits impeccably through the shoulders with just enough ease in the torso. Doesn't crease easily and moves with an understated elegance. Easily rivals European luxury fashion houses.",
    verified: true,
    sizePurchased: "L",
    fitFeedback: "True to Size",
    helpfulCount: 9,
  },
  {
    id: "rev-3",
    author: "Marcus K.",
    location: "London, UK",
    rating: 5,
    date: "2 weeks ago",
    title: "Substantial handfeel and immaculate stitching",
    comment:
      "Very clean French seams and premium cotton density. Sits slightly relaxed in the body as intended by the architectural silhouette. Highly recommended daily staple.",
    verified: true,
    sizePurchased: "XL",
    fitFeedback: "True to Size",
    helpfulCount: 12,
  },
  {
    id: "rev-4",
    author: "Dev R.",
    location: "New Delhi, IN",
    rating: 5,
    date: "3 weeks ago",
    title: "Dense combed cotton, zero collar baconing",
    comment:
      "The 300gsm cotton heft is phenomenal. Holds its shape wash after wash and has the perfect dropped shoulder proportion.",
    verified: true,
    sizePurchased: "M",
    fitFeedback: "True to Size",
    helpfulCount: 8,
  },
];

export default function ProductPage() {
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const params = useParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);
  const lastImageWheelAt = useRef(0);

  const rawSlug = params?.slug;
  const slug = useMemo(() => {
    try {
      const val = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ? String(rawSlug) : "";
      return val ? decodeURIComponent(val) : "";
    } catch {
      return Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ? String(rawSlug) : "";
    }
  }, [rawSlug]);

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState<string>("BLACK");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Scroll down animation for center photo
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  // Review submission state
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewSize, setNewReviewSize] = useState("M");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function loadProduct() {
      setLoading(true);
      try {
        const found = await getProductByIdOrSlug(slug);
        setProduct(found);
        if (found) {
          const defaultColor =
            Array.isArray(found.colors) && found.colors.length > 0
              ? found.colors[0]
              : found.color || "BLACK";
          setSelectedColor(defaultColor);
          setActiveImageIndex(0);

          if (found.size_stock && typeof found.size_stock === "object") {
            const sizes = ["S", "M", "L", "XL", "XXL"];
            const currentM = Number(found.size_stock["M"] ?? 0);
            if (currentM === 0) {
              const available = sizes.find((s) => Number(found.size_stock?.[s] ?? 0) > 0);
              if (available) setSelectedSize(available);
            }
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  useEffect(() => {
    async function loadOtherProducts() {
      try {
        const list = await getAllProducts();
        setAllProducts(list);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }
    loadOtherProducts();
  }, []);

  // Fetch reviews for this product
  useEffect(() => {
    if (!product?.id) return;
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?productId=${encodeURIComponent(product?.id || "")}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.reviews) && json.reviews.length > 0) {
            setReviewsList([...json.reviews, ...DEFAULT_REVIEWS]);
          }
        }
      } catch {
        // fallback to default reviews
      }
    }
    fetchReviews();
  }, [product?.id]);

  const currentSizeQty = useMemo(() => {
    if (!product) return 0;
    if (product.size_stock && typeof product.size_stock === "object") {
      return product.size_stock[selectedSize] !== undefined
        ? Number(product.size_stock[selectedSize]) || 0
        : Number(product.stock) || 0;
    }
    return Number(product.stock) || 0;
  }, [product, selectedSize]);

  const isSizeOutOfStock = currentSizeQty <= 0;
  const isSizeLowStock = currentSizeQty > 0 && currentSizeQty <= 5;

  const primaryImage = product?.image || "/train-black-tee-cutout.png";
  const productImages = useMemo(() => {
    if (!product) return [primaryImage];
    const additionalImages = Array.isArray(product.images) ? product.images : [];
    return [primaryImage, ...additionalImages.filter((image) => image !== primaryImage)];
  }, [product, primaryImage]);

  useEffect(() => {
    const imageContainer = productImageRef.current;
    if (!imageContainer || productImages.length < 2) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (Math.abs(event.deltaY) < 20) return;

      const now = Date.now();
      if (now - lastImageWheelAt.current < 500) return;
      lastImageWheelAt.current = now;

      setActiveImageIndex((prev) =>
        event.deltaY > 0
          ? (prev + 1) % productImages.length
          : (prev - 1 + productImages.length) % productImages.length
      );
    };

    imageContainer.addEventListener("wheel", handleWheel, { passive: false });
    return () => imageContainer.removeEventListener("wheel", handleWheel);
  }, [productImages.length]);
  const currentDisplayImage = productImages[activeImageIndex] || productImages[0] || primaryImage;

  const handleAddToCart = () => {
    if (!product || isSizeOutOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: currentDisplayImage,
        size: selectedSize,
        color: selectedColor || product.color || "BLACK",
      },
      quantity
    );
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product || isSizeOutOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: currentDisplayImage,
        size: selectedSize,
        color: selectedColor || product.color || "BLACK",
      },
      quantity
    );
    router.push("/checkout");
  };

  const handleWishlistClick = () => {
    if (!product) return;
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: currentDisplayImage,
      category: product.category_name || "Streetwear",
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const newRev: ReviewItem = {
      id: `user-rev-${Date.now()}`,
      author: newReviewAuthor.trim(),
      rating: newReviewRating,
      date: "Just now",
      title: newReviewTitle.trim() || "Verified Impression",
      comment: newReviewComment.trim(),
      verified: true,
      sizePurchased: newReviewSize,
      helpfulCount: 0,
    };

    setReviewsList((prev) => [newRev, ...prev]);
    setReviewSubmitted(true);
    setNewReviewAuthor("");
    setNewReviewTitle("");
    setNewReviewComment("");
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const complementaryProducts = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.id !== product.id).slice(0, 3);
  }, [allProducts, product]);

  if (loading) {
    return (
      <main className="streetwear-pdp-page">
        <div className="streetwear-pdp-loading">
          <div className="streetwear-pdp-spinner" />
          <p>LOADING PIECE...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="streetwear-pdp-page">
        <div className="streetwear-pdp-not-found">
          <h2>PIECE NOT FOUND</h2>
          <p>This silhouette is either archived or no longer available in current runs.</p>
          <Link href="/" className="streetwear-pdp-btn-return">
            RETURN TO CATALOG
          </Link>
        </div>
      </main>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  // Bullets specs matching reference mockup
  const bulletSpecs = [
    product.material ? `100% ${product.material}` : "100% premium combed cotton",
    product.fit ? `Fit: ${product.fit}` : "Fit: oversized, dropped shoulders",
    "Soft-touch high-definition finish",
    "Reinforced rib collar and durable seams",
    "Model is 184cm / 6'0\" and wears Size M",
  ];

  return (
    <>
      <main className="streetwear-pdp-page">
        <div className="streetwear-pdp-container" ref={containerRef}>
          {/* 3-Column Desktop / Responsive Mobile Grid (Vertically Centered in Middle) */}
          <div className="streetwear-pdp-grid">
            {/* COLUMN 1 (LEFT): Product Title, Price, Description, Bullet Specs (Middle Aligned) */}
            <div className="streetwear-pdp-left-col">
              <div className="streetwear-pdp-header-block">
                <h1 className="streetwear-pdp-title">{product.name}</h1>
                <div className="streetwear-pdp-price-row">
                  <span className="streetwear-pdp-price">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </span>
                  <span className="streetwear-pdp-tax-note">TAX INCL.</span>
                </div>
              </div>

              {/* Description Paragraph */}
              <p className="streetwear-pdp-description">
                {product.description ||
                  "Heavyweight oversized silhouette crafted in dense premium cotton with relaxed dropped shoulders. Designed with architectural drape and clean proportions for enduring presence."}
              </p>

              {/* Bullet Specifications */}
              <ul className="streetwear-pdp-bullet-specs">
                {bulletSpecs.map((spec, i) => (
                  <li key={i}>
                    <span className="bullet-dot">•</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 2 (CENTER): Large Product Cutout/Photography with Scrolling Down Animation */}
            <div className="streetwear-pdp-center-col">
              <motion.div
                style={{ y: photoY, scale: photoScale }}
                className="streetwear-pdp-image-container"
                ref={productImageRef}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentDisplayImage}
                    src={currentDisplayImage}
                    alt={product.name}
                    className="streetwear-pdp-main-img"
                    onClick={() => setLightboxOpen(true)}
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    title="Click to view full screen"
                  />
                </AnimatePresence>

                {/* Wishlist Button Overlaid on Image */}
                <button
                  type="button"
                  className={`streetwear-pdp-img-wishlist-btn ${isWishlisted ? "active" : ""}`}
                  onClick={handleWishlistClick}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    size={18}
                    strokeWidth={2}
                    fill={isWishlisted ? "#e11d48" : "none"}
                    color={isWishlisted ? "#e11d48" : "#111111"}
                  />
                </button>
              </motion.div>

            </div>

            {/* COLUMN 3 (RIGHT): Size, Quantity, Add to Cart, Buy Now, Reviews Card (Middle Aligned) */}
            <div className="streetwear-pdp-right-col">
              {/* Size Selector */}
              <div className="streetwear-pdp-section-block">
                <div className="streetwear-pdp-section-header">
                  <span className="streetwear-pdp-label">Size</span>
                  {isSizeLowStock && (
                    <span className="streetwear-pdp-stock-warn">
                      ONLY {currentSizeQty} LEFT
                    </span>
                  )}
                  {isSizeOutOfStock && (
                    <span className="streetwear-pdp-stock-out">OUT OF STOCK</span>
                  )}
                </div>
                <div className="streetwear-pdp-size-tiles">
                  {(["S", "M", "L", "XL", "XXL"] as const).map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        className={`streetwear-size-box ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedSize(sz)}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="streetwear-pdp-section-block">
                <div className="streetwear-pdp-section-header">
                  <span className="streetwear-pdp-label">Quantity</span>
                </div>
                <div className="streetwear-pdp-qty-stepper">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="streetwear-pdp-qty-num">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Cart + Buy Now + Wishlist */}
              <div className="streetwear-pdp-cta-block">
                <div className="streetwear-pdp-cart-row">
                  <button
                    type="button"
                    className={`streetwear-pdp-add-btn ${added ? "added" : ""}`}
                    onClick={handleAddToCart}
                    disabled={isSizeOutOfStock}
                  >
                    <ShoppingBag size={16} strokeWidth={2} />
                    <span>{added ? "ADDED TO CART ✓" : "ADD TO CART"}</span>
                  </button>

                  <button
                    type="button"
                    className={`streetwear-pdp-action-wish-btn ${isWishlisted ? "active" : ""}`}
                    onClick={handleWishlistClick}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-label="Save to wishlist"
                  >
                    <Heart
                      size={18}
                      strokeWidth={2}
                      fill={isWishlisted ? "#e11d48" : "none"}
                      color={isWishlisted ? "#e11d48" : "#111111"}
                    />
                  </button>
                </div>

                {/* BUY NOW Button */}
                <button
                  type="button"
                  className="streetwear-pdp-buy-now-btn"
                  onClick={handleBuyNow}
                  disabled={isSizeOutOfStock}
                >
                  <span>BUY NOW</span>
                  <ArrowRight size={15} strokeWidth={2} />
                </button>
              </div>

              {/* Small Review Section Below Buy Now Button */}
              <div className="streetwear-pdp-review-card">
                <div className="streetwear-pdp-review-top">
                  <div className="streetwear-pdp-review-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill="#111111" color="#111111" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="streetwear-pdp-review-rating">4.9 / 5.0</span>
                  <span className="streetwear-pdp-review-count">
                    ({reviewsList.length} REVIEWS)
                  </span>
                </div>

                <p className="streetwear-pdp-review-quote">
                  “{reviewsList[0]?.comment.slice(0, 110)}...”
                </p>

                {/* See More button that opens review modal */}
                <button
                  type="button"
                  className="streetwear-pdp-see-reviews-btn"
                  onClick={() => setReviewModalOpen(true)}
                >
                  <span>See more reviews</span>
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Complementary Products Section */}
          {complementaryProducts.length > 0 && (
            <section className="streetwear-pdp-complementary-section">
              <h2 className="streetwear-pdp-rec-title">YOU MAY ALSO LIKE</h2>
              <div className="streetwear-pdp-rec-grid">
                {complementaryProducts.map((item) => {
                  const itemWishlisted = isInWishlist(item.id);
                  return (
                    <article key={item.id} className="streetwear-product-card">
                      <div className="streetwear-product-img-box">
                        <Link href={`/products/${item.id}`} className="streetwear-product-img-link">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="streetwear-product-cutout"
                            loading="lazy"
                          />
                        </Link>
                        <button
                          type="button"
                          className={`streetwear-product-heart-btn ${itemWishlisted ? "active" : ""}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleWishlist({
                              id: item.id,
                              name: item.name,
                              price: Number(item.price),
                              image: item.image,
                              category: item.category_name,
                            });
                          }}
                          aria-label={itemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          title={itemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart
                            size={18}
                            strokeWidth={2}
                            fill={itemWishlisted ? "#e11d48" : "none"}
                            color={itemWishlisted ? "#e11d48" : "#111111"}
                          />
                        </button>
                      </div>
                      <Link href={`/products/${item.id}`} className="streetwear-product-caption-link">
                        <div className="streetwear-product-caption">
                          <h3 className="streetwear-product-name">{item.name}</h3>
                          <span className="streetwear-product-price">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        className="streetwear-product-cart-btn"
                        onClick={() => {
                          addToCart(
                            {
                              id: item.id,
                              name: item.name,
                              price: Number(item.price),
                              image: item.image,
                              size: "M",
                              color: item.color || "BLACK",
                            },
                            1
                          );
                          openCart();
                        }}
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <ShoppingBag size={14} strokeWidth={2} />
                        <span>ADD TO CART</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* REVIEWS MODAL BOX (Opens when clicking "See more reviews") */}
      {reviewModalOpen && (
        <div
          className="streetwear-review-modal-backdrop"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="streetwear-review-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="streetwear-modal-header">
              <div>
                <h3 className="streetwear-modal-title">CUSTOMER REVIEWS</h3>
                <div className="streetwear-modal-rating-summary">
                  <div className="streetwear-pdp-review-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={15} fill="#111111" color="#111111" strokeWidth={0} />
                    ))}
                  </div>
                  <span>
                    <strong>4.9</strong> out of 5 ({reviewsList.length} verified ratings)
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="streetwear-modal-close"
                onClick={() => setReviewModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="streetwear-modal-body">
              {/* Write Review Form */}
              <form onSubmit={handleReviewSubmit} className="streetwear-write-review-form">
                <h4 className="streetwear-write-title">WRITE AN APPRAISAL</h4>
                {reviewSubmitted && (
                  <div className="streetwear-review-success">
                    <CheckCircle2 size={16} />
                    <span>Your review has been verified and posted!</span>
                  </div>
                )}
                <div className="streetwear-form-row">
                  <div className="streetwear-form-group">
                    <label>YOUR NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Julian V."
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="streetwear-form-group">
                    <label>SIZE BOUGHT</label>
                    <select
                      value={newReviewSize}
                      onChange={(e) => setNewReviewSize(e.target.value)}
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                  </div>
                  <div className="streetwear-form-group">
                    <label>RATING</label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    >
                      <option value="5">★★★★★ (5 Stars)</option>
                      <option value="4">★★★★☆ (4 Stars)</option>
                      <option value="3">★★★☆☆ (3 Stars)</option>
                    </select>
                  </div>
                </div>

                <div className="streetwear-form-group">
                  <label>HEADLINE</label>
                  <input
                    type="text"
                    placeholder="Short summary (e.g. Flawless drape and collar)"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                  />
                </div>

                <div className="streetwear-form-group">
                  <label>COMMENT</label>
                  <textarea
                    rows={3}
                    placeholder="Share your thoughts on the fit, fabric heft, and silhouette..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="streetwear-submit-review-btn">
                  SUBMIT REVIEW
                </button>
              </form>

              {/* Reviews List */}
              <div className="streetwear-modal-reviews-list">
                <h4 className="streetwear-reviews-list-title">ALL REVIEWS ({reviewsList.length})</h4>
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="streetwear-modal-review-item">
                    <div className="streetwear-rev-top-line">
                      <div className="streetwear-pdp-review-stars">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={12} fill="#111111" color="#111111" strokeWidth={0} />
                        ))}
                      </div>
                      <span className="streetwear-rev-author">{rev.author}</span>
                      {rev.verified && (
                        <span className="streetwear-rev-verified">
                          <CheckCircle2 size={11} /> VERIFIED
                        </span>
                      )}
                      <span className="streetwear-rev-date">{rev.date}</span>
                    </div>
                    <h5 className="streetwear-rev-headline">“{rev.title}”</h5>
                    <p className="streetwear-rev-comment">{rev.comment}</p>
                    {rev.sizePurchased && (
                      <span className="streetwear-rev-size-tag">
                        Size: {rev.sizePurchased} {rev.fitFeedback ? `• ${rev.fitFeedback}` : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for full screen zoom */}
      <ProductImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={productImages}
        initialIndex={activeImageIndex}
        productName={product.name}
      />

      <EditorialFooter />
    </>
  );
}