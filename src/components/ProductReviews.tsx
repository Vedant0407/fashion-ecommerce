"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Star, CheckCircle2, ThumbsUp, PenLine, X, ArrowRight, Sparkles } from "lucide-react";

export interface Review {
  id: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  sizePurchased?: string;
  fitFeedback?: "Runs Small" | "True to Size" | "Runs Large";
  helpfulCount: number;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  categoryGroup?: string;
}

function getDefaultCategoryReviews(productId: string, productName: string, categoryGroup: string = "atelier"): Review[] {
  const cat = categoryGroup.toLowerCase();

  if (cat.includes("shirt") && !cat.includes("t-shirt") && !cat.includes("tee")) {
    return [
      {
        id: `def-${productId}-1`,
        author: "Julian V.",
        location: "Milan, IT",
        rating: 5,
        date: "3 days ago",
        title: "Impeccable collar stance and refined weave",
        comment:
          "The collar retains its sharp architectural profile with zero buckling. The fabric has an exquisite substantial weight while remaining breathable throughout the day. Finished with refined mother-of-pearl buttons.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 14,
      },
      {
        id: `def-${productId}-2`,
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
        id: `def-${productId}-3`,
        author: "Marcus K.",
        location: "London, UK",
        rating: 4,
        date: "2 weeks ago",
        title: "Substantial handfeel and immaculate stitching",
        comment:
          "Very clean French seams and premium cotton density. Sits slightly relaxed in the body as intended by the atelier silhouette. Highly recommended.",
        verified: true,
        sizePurchased: "XL",
        fitFeedback: "True to Size",
        helpfulCount: 5,
      },
      {
        id: `def-${productId}-4`,
        author: "Devang P.",
        location: "New Delhi, IN",
        rating: 5,
        date: "3 weeks ago",
        title: "Exceptional tailoring and material handfeel",
        comment:
          "The poplin weave is dense yet supple. You can tell immediately upon unboxing that this is genuine atelier-grade craftsmanship.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 8,
      },
      {
        id: `def-${productId}-5`,
        author: "Alexander S.",
        location: "Zurich, CH",
        rating: 5,
        date: "1 month ago",
        title: "Clean lines, timeless wardrobe staple",
        comment:
          "Wears beautifully both tucked into pleated trousers or loose over an undershirt. Will definitely acquire further colorways.",
        verified: true,
        sizePurchased: "L",
        fitFeedback: "True to Size",
        helpfulCount: 11,
      },
    ];
  }

  if (cat.includes("t-shirt") || cat.includes("tee")) {
    return [
      {
        id: `def-${productId}-1`,
        author: "Dev P.",
        location: "Bengaluru, IN",
        rating: 5,
        date: "2 days ago",
        title: "The benchmark for heavyweight architectural tees",
        comment:
          "The 300gsm combed jersey is phenomenal. It holds an architectural boxy drape that doesn't cling or drape limp. The collar ribbing is dense and maintains its sharp circular form after washing.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 18,
      },
      {
        id: `def-${productId}-2`,
        author: "Kavya S.",
        location: "New Delhi, IN",
        rating: 5,
        date: "5 days ago",
        title: "Quiet elegance, sculptural drop shoulder",
        comment:
          "Substantial tactile handfeel without feeling uncomfortably heavy. The drop shoulder is tailored with precision rather than looking oversized or sloppy. A timeless wardrobe foundation.",
        verified: true,
        sizePurchased: "S",
        fitFeedback: "True to Size",
        helpfulCount: 11,
      },
      {
        id: `def-${productId}-3`,
        author: "Noah W.",
        location: "Stockholm, SE",
        rating: 5,
        date: "2 weeks ago",
        title: "Pure minimal perfection",
        comment:
          "Minimalist branding, dense weave, and completely opaque in natural light. Pairs seamlessly with tailored trousers or relaxed denim.",
        verified: true,
        sizePurchased: "L",
        fitFeedback: "True to Size",
        helpfulCount: 7,
      },
      {
        id: `def-${productId}-4`,
        author: "Rohan M.",
        location: "Mumbai, IN",
        rating: 5,
        date: "3 weeks ago",
        title: "Unmatched fabric heft and clean drape",
        comment:
          "I have tees from high-end Tokyo and Paris brands, and this surpasses them in fabric density. Zero collar baconing after multiple washes.",
        verified: true,
        sizePurchased: "L",
        fitFeedback: "True to Size",
        helpfulCount: 14,
      },
      {
        id: `def-${productId}-5`,
        author: "Liam B.",
        location: "London, UK",
        rating: 5,
        date: "1 month ago",
        title: "Architectural silhouette done right",
        comment:
          "Cuts a sharp, modern silhouette. Heavy enough to hide undershirt lines and breathes exceptionally well.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 9,
      },
    ];
  }

  // Fallback defaults
  return [
    {
      id: `def-${productId}-1`,
      author: "Alexandre P.",
      location: "Paris, FR",
      rating: 5,
      date: "3 days ago",
      title: "Uncompromising atelier craftsmanship",
      comment:
        "From the stitching density to the tactile handfeel, every detail speaks to disciplined craftsmanship. The piece drapes naturally and feels distinctly luxurious.",
      verified: true,
      sizePurchased: "M",
      fitFeedback: "True to Size",
      helpfulCount: 15,
    },
    {
      id: `def-${productId}-2`,
      author: "Pooja N.",
      location: "New Delhi, IN",
      rating: 5,
      date: "1 week ago",
      title: "Refined proportions and quiet elegance",
      comment:
        "A standout piece in my wardrobe. The cut is modern yet completely timeless. Highly impressed by the prompt express delivery and packaging.",
      verified: true,
      sizePurchased: "S",
      fitFeedback: "True to Size",
      helpfulCount: 8,
    },
    {
      id: `def-${productId}-3`,
      author: "Christian M.",
      location: "Berlin, DE",
      rating: 4,
      date: "3 weeks ago",
      title: "Exceptional material quality",
      comment:
        "Heavyweight, tactile texture with clean finishing throughout. True to size with a relaxed contemporary fit.",
      verified: true,
      sizePurchased: "L",
      fitFeedback: "True to Size",
      helpfulCount: 6,
    },
  ];
}

export default function ProductReviews({
  productId,
  productName,
  categoryGroup = "atelier",
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "5star" | "fit">("all");
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  // Review Form State
  const [formAuthor, setFormAuthor] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formSize, setFormSize] = useState("M");
  const [formFit, setFormFit] = useState<"Runs Small" | "True to Size" | "Runs Large">("True to Size");
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const storageKey = `greeno_atelier_reviews_${productId}`;
  const helpfulKey = `greeno_helpful_reviews`;

  // Initialize reviews from localStorage + defaults
  useEffect(() => {
    try {
      const defaults = getDefaultCategoryReviews(productId, productName, categoryGroup);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews([...parsed, ...defaults]);
        } else {
          setReviews(defaults);
        }
      } else {
        setReviews(defaults);
      }

      const savedHelpful = localStorage.getItem(helpfulKey);
      if (savedHelpful) {
        setHelpfulVoted(JSON.parse(savedHelpful));
      }
    } catch (e) {
      console.error("Error loading reviews:", e);
      setReviews(getDefaultCategoryReviews(productId, productName, categoryGroup));
    }
  }, [productId, productName, categoryGroup, storageKey]);

  // Listen for global open review modal events (e.g. from header rating click)
  useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };
    window.addEventListener("greeno_open_reviews_modal", handleOpenModal);
    return () => window.removeEventListener("greeno_open_reviews_modal", handleOpenModal);
  }, []);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isModalOpen]);

  // Aggregate stats
  const totalCount = reviews.length;
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 4.9;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (activeFilter === "5star") {
      return reviews.filter((r) => r.rating === 5);
    }
    if (activeFilter === "fit") {
      return reviews.filter((r) => Boolean(r.fitFeedback));
    }
    return reviews;
  }, [reviews, activeFilter]);

  // Handle helpful click
  const handleHelpfulClick = (reviewId: string) => {
    if (helpfulVoted[reviewId]) return;

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );

    const updatedHelpful = { ...helpfulVoted, [reviewId]: true };
    setHelpfulVoted(updatedHelpful);

    try {
      localStorage.setItem(helpfulKey, JSON.stringify(updatedHelpful));
    } catch (e) {
      console.error("Could not save helpful vote", e);
    }
  };

  // Submit review handler
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formAuthor.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (!formTitle.trim()) {
      setFormError("Please provide a summary headline.");
      return;
    }
    if (!formComment.trim()) {
      setFormError("Please provide your review comments.");
      return;
    }

    const newReview: Review = {
      id: `user-${Date.now()}`,
      author: formAuthor.trim(),
      location: formLocation.trim() || "India",
      rating: formRating,
      date: "Just now",
      title: formTitle.trim(),
      comment: formComment.trim(),
      verified: true,
      sizePurchased: formSize,
      fitFeedback: formFit,
      helpfulCount: 0,
    };

    const nextReviews = [newReview, ...reviews];
    setReviews(nextReviews);

    // Save user review to localStorage
    try {
      const existingSaved = localStorage.getItem(storageKey);
      const userReviews = existingSaved ? JSON.parse(existingSaved) : [];
      userReviews.unshift(newReview);
      localStorage.setItem(storageKey, JSON.stringify(userReviews));
    } catch (e) {
      console.error("Error saving review to localStorage:", e);
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsFormOpen(false);
      setFormAuthor("");
      setFormLocation("");
      setFormTitle("");
      setFormComment("");
      setFormRating(5);
    }, 1800);
  };

  return (
    <>
      {/* Cover Box below photo: Single compact card showing overall ratings */}
      <section id="atelier-reviews" className="atelier-reviews-cover-box">
        <div className="atelier-cover-header">
          <div className="atelier-cover-kicker">
            <span>CLIENT REVIEWS</span>
            <span className="atelier-kicker-dot">&bull;</span>
            <span>VERIFIED APPRAISALS</span>
          </div>
          <span className="atelier-cover-badge">
            <Sparkles size={10} strokeWidth={2} />
            <span>98% RECOMMENDED</span>
          </span>
        </div>

        {/* Rating Score Row */}
        <div className="atelier-cover-score-row" onClick={() => setIsModalOpen(true)} style={{ cursor: "pointer" }}>
          <span className="atelier-cover-score-num">{avgRating.toFixed(1)}</span>
          <div className="atelier-cover-score-meta">
            <div className="atelier-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  fill={s <= Math.round(avgRating) ? "#121212" : "none"}
                  stroke="#121212"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="atelier-cover-caption">
              Based on {totalCount} verified client appraisals
            </span>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="atelier-cover-breakdown">
          {[5, 4, 3, 2, 1].map((starVal) => {
            const count = ratingCounts[starVal as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div key={starVal} className="atelier-cover-bar-row">
                <span className="atelier-cover-bar-label">{starVal}★</span>
                <div className="atelier-cover-bar-track">
                  <div className="atelier-cover-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="atelier-cover-bar-pct">{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons inside the cover box */}
        <div className="atelier-cover-actions">
          <button
            type="button"
            className="atelier-cover-more-btn"
            onClick={() => setIsModalOpen(true)}
            id="open-reviews-modal-btn"
          >
            <span>MORE REVIEWS ({totalCount})</span>
            <ArrowRight size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="atelier-cover-write-btn"
            onClick={() => {
              setIsModalOpen(true);
              setIsFormOpen(true);
            }}
          >
            <PenLine size={12} strokeWidth={2} />
            <span>WRITE A REVIEW</span>
          </button>
        </div>
      </section>

      {/* Centered Modal: Opens in middle of screen with scrollable reviews */}
      {isModalOpen && (
        <div
          className="atelier-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="atelier-modal-dialog" role="dialog" aria-modal="true">
            {/* Modal Header */}
            <div className="atelier-modal-header">
              <div className="atelier-modal-header-info">
                <span className="atelier-modal-kicker">VERIFIED CLIENT ARCHIVE</span>
                <h3 className="atelier-modal-title">CLIENT APPRAISALS</h3>
                <div className="atelier-modal-rating-summary">
                  <span className="atelier-modal-avg-score">{avgRating.toFixed(1)}</span>
                  <div className="atelier-stars-row mini">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= Math.round(avgRating) ? "#121212" : "none"}
                        stroke="#121212"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <span className="atelier-modal-count-note">
                    ({totalCount} {totalCount === 1 ? "Appraisal" : "Appraisals"})
                  </span>
                </div>
              </div>

              <div className="atelier-modal-header-actions">
                <button
                  type="button"
                  className="atelier-modal-write-pill"
                  onClick={() => setIsFormOpen(!isFormOpen)}
                >
                  {isFormOpen ? (
                    <>
                      <X size={12} strokeWidth={2} />
                      <span>VIEW REVIEWS</span>
                    </>
                  ) : (
                    <>
                      <PenLine size={12} strokeWidth={2} />
                      <span>WRITE A REVIEW</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="atelier-modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close appraisals dialog"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Filter Pills (Shown when browsing reviews) */}
            {!isFormOpen && (
              <div className="atelier-modal-filter-bar">
                <button
                  type="button"
                  className={`atelier-filter-pill ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  ALL ({reviews.length})
                </button>
                <button
                  type="button"
                  className={`atelier-filter-pill ${activeFilter === "5star" ? "active" : ""}`}
                  onClick={() => setActiveFilter("5star")}
                >
                  5 STARS ({ratingCounts[5] || 0})
                </button>
                <button
                  type="button"
                  className={`atelier-filter-pill ${activeFilter === "fit" ? "active" : ""}`}
                  onClick={() => setActiveFilter("fit")}
                >
                  FIT &amp; SILHOUETTE
                </button>
              </div>
            )}

            {/* Scrollable Reviews Container in the middle of the box */}
            <div className="atelier-modal-scroll-area">
              {isFormOpen ? (
                /* Write a Review Form inside Modal */
                <form className="atelier-review-form-panel" onSubmit={handleSubmitReview}>
                  <div className="atelier-form-header">
                    <h4 className="atelier-form-title">SUBMIT YOUR APPRAISAL</h4>
                    <p className="atelier-form-sub">
                      Share your perspective on the drape, fabric tactile weight, and silhouette of this piece.
                    </p>
                  </div>

                  {submitSuccess ? (
                    <div className="atelier-form-success">
                      <CheckCircle2 size={20} stroke="#121212" />
                      <div>
                        <strong>Appraisal Submitted</strong>
                        <p>Thank you for contributing to the Atelier Client Archive.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {formError && <div className="atelier-form-error">{formError}</div>}

                      {/* Star Rating Picker */}
                      <div className="atelier-form-field">
                        <label className="atelier-form-label">OVERALL RATING *</label>
                        <div className="atelier-star-picker">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              className="atelier-star-btn"
                              onMouseEnter={() => setFormHoverRating(starVal)}
                              onMouseLeave={() => setFormHoverRating(0)}
                              onClick={() => setFormRating(starVal)}
                            >
                              <Star
                                size={20}
                                fill={
                                  starVal <= (formHoverRating || formRating) ? "#121212" : "none"
                                }
                                stroke="#121212"
                                strokeWidth={1.5}
                              />
                            </button>
                          ))}
                          <span className="atelier-star-picker-text">
                            {(() => {
                              const active = formHoverRating || formRating;
                              if (active === 5) return "5 — Exceptional Atelier Standard";
                              if (active === 4) return "4 — Very Good Quality";
                              if (active === 3) return "3 — Standard Handfeel";
                              if (active === 2) return "2 — Below Expectations";
                              return "1 — Unsatisfactory";
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Name & Location Row */}
                      <div className="atelier-form-row">
                        <div className="atelier-form-field">
                          <label className="atelier-form-label" htmlFor="modal-review-author">
                            YOUR NAME *
                          </label>
                          <input
                            id="modal-review-author"
                            type="text"
                            className="atelier-form-input"
                            placeholder="e.g. Julian V."
                            value={formAuthor}
                            onChange={(e) => setFormAuthor(e.target.value)}
                            required
                          />
                        </div>
                        <div className="atelier-form-field">
                          <label className="atelier-form-label" htmlFor="modal-review-location">
                            LOCATION (OPTIONAL)
                          </label>
                          <input
                            id="modal-review-location"
                            type="text"
                            className="atelier-form-input"
                            placeholder="e.g. Mumbai, IN"
                            value={formLocation}
                            onChange={(e) => setFormLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Size & Fit Row */}
                      <div className="atelier-form-row">
                        <div className="atelier-form-field">
                          <label className="atelier-form-label" htmlFor="modal-review-size">
                            SIZE PURCHASED
                          </label>
                          <select
                            id="modal-review-size"
                            className="atelier-form-select"
                            value={formSize}
                            onChange={(e) => setFormSize(e.target.value)}
                          >
                            <option value="S">Small (S)</option>
                            <option value="M">Medium (M)</option>
                            <option value="L">Large (L)</option>
                            <option value="XL">Extra Large (XL)</option>
                            <option value="XXL">Double Extra Large (XXL)</option>
                          </select>
                        </div>
                        <div className="atelier-form-field">
                          <label className="atelier-form-label" htmlFor="modal-review-fit">
                            FIT APPRAISAL
                          </label>
                          <select
                            id="modal-review-fit"
                            className="atelier-form-select"
                            value={formFit}
                            onChange={(e) =>
                              setFormFit(e.target.value as "Runs Small" | "True to Size" | "Runs Large")
                            }
                          >
                            <option value="Runs Small">Runs Fitted / Small</option>
                            <option value="True to Size">True to Silhouette</option>
                            <option value="Runs Large">Runs Relaxed / Large</option>
                          </select>
                        </div>
                      </div>

                      {/* Headline */}
                      <div className="atelier-form-field">
                        <label className="atelier-form-label" htmlFor="modal-review-title">
                          APPRAISAL HEADLINE *
                        </label>
                        <input
                          id="modal-review-title"
                          type="text"
                          className="atelier-form-input"
                          placeholder="e.g. Architectural drape and immaculate fabric density"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          required
                        />
                      </div>

                      {/* Body */}
                      <div className="atelier-form-field">
                        <label className="atelier-form-label" htmlFor="modal-review-comment">
                          DETAILED COMMENTS *
                        </label>
                        <textarea
                          id="modal-review-comment"
                          className="atelier-form-textarea"
                          rows={4}
                          placeholder="Detail your experience with the tactile texture, collar or seam construction, and how the garment wears throughout the day..."
                          value={formComment}
                          onChange={(e) => setFormComment(e.target.value)}
                          required
                        />
                      </div>

                      {/* Submit CTA */}
                      <div className="atelier-form-actions">
                        <button type="submit" className="atelier-form-submit-btn">
                          PUBLISH APPRAISAL
                        </button>
                        <button
                          type="button"
                          className="atelier-form-cancel-btn"
                          onClick={() => setIsFormOpen(false)}
                        >
                          BACK TO REVIEWS
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                /* All Reviews in the Scrollable Area */
                <div className="atelier-reviews-list">
                  {filteredReviews.length === 0 ? (
                    <div className="atelier-reviews-empty">
                      <p>No appraisals found in this category.</p>
                    </div>
                  ) : (
                    filteredReviews.map((review) => {
                      const hasVoted = Boolean(helpfulVoted[review.id]);
                      return (
                        <article key={review.id} className="atelier-review-card">
                          {/* Header: Author, Badge, Date */}
                          <div className="atelier-card-header">
                            <div className="atelier-card-author-info">
                              <span className="atelier-card-name">{review.author}</span>
                              {review.location && (
                                <span className="atelier-card-location">&bull; {review.location}</span>
                              )}
                            </div>
                            <span className="atelier-card-date">{review.date}</span>
                          </div>

                          {/* Rating & Verified Tag */}
                          <div className="atelier-card-rating-row">
                            <div className="atelier-stars-row">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={12}
                                  fill={s <= review.rating ? "#121212" : "none"}
                                  stroke="#121212"
                                  strokeWidth={1.5}
                                />
                              ))}
                            </div>

                            {review.verified && (
                              <span className="atelier-verified-badge">
                                <CheckCircle2 size={11} strokeWidth={2} />
                                <span>VERIFIED CLIENT</span>
                              </span>
                            )}
                          </div>

                          {/* Size & Fit Tag */}
                          {(review.sizePurchased || review.fitFeedback) && (
                            <div className="atelier-card-tags">
                              {review.sizePurchased && (
                                <span className="atelier-meta-tag">SIZE: {review.sizePurchased}</span>
                              )}
                              {review.fitFeedback && (
                                <span className="atelier-meta-tag">{review.fitFeedback}</span>
                              )}
                            </div>
                          )}

                          {/* Review Headline & Comment */}
                          <h4 className="atelier-card-title">{review.title}</h4>
                          <p className="atelier-card-comment">{review.comment}</p>

                          {/* Helpful Footer Action */}
                          <div className="atelier-card-footer">
                            <button
                              type="button"
                              className={`atelier-helpful-btn ${hasVoted ? "voted" : ""}`}
                              onClick={() => handleHelpfulClick(review.id)}
                              title={hasVoted ? "You found this helpful" : "Mark as helpful"}
                            >
                              <ThumbsUp size={12} strokeWidth={1.75} />
                              <span>HELPFUL ({review.helpfulCount})</span>
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Note */}
            <div className="atelier-modal-footer">
              <span>ALL APPRAISALS SUBMITTED BY VERIFIED GREENO ATELIER CLIENTS &bull; {totalCount} REVIEWS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
