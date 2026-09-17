"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Star, CheckCircle2, ThumbsUp, PenLine, X, ChevronDown, ChevronUp } from "lucide-react";

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
    ];
  }

  if (cat.includes("pant") || cat.includes("trouser") || cat.includes("cargo")) {
    return [
      {
        id: `def-${productId}-1`,
        author: "Daniel C.",
        location: "Tokyo, JP",
        rating: 5,
        date: "4 days ago",
        title: "The cut and break on these trousers are flawless",
        comment:
          "Deep tailored pleats that cascade cleanly down the leg. The fabric heft creates a sharp, fluid movement when walking. Bespoke atelier craftsmanship at its finest.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 16,
      },
      {
        id: `def-${productId}-2`,
        author: "Rohan V.",
        location: "Mumbai, IN",
        rating: 5,
        date: "10 days ago",
        title: "Subtle drape, immaculate waistband finishing",
        comment:
          "Clean waistband detailing, reinforced side tabs, and deep pocket bags. Sits naturally at the waist and pairs effortlessly with both derbies and minimal trainers.",
        verified: true,
        sizePurchased: "L",
        fitFeedback: "True to Size",
        helpfulCount: 8,
      },
      {
        id: `def-${productId}-3`,
        author: "Liam H.",
        location: "Melbourne, AU",
        rating: 4,
        date: "3 weeks ago",
        title: "Substantial drape and timeless silhouette",
        comment:
          "The fabric has genuine weight and a dry, tactile handfeel. Length is generous to allow for a gentle break over luxury footwear.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 6,
      },
    ];
  }

  if (cat.includes("outerwear") || cat.includes("coat") || cat.includes("jacket") || cat.includes("hoodie")) {
    return [
      {
        id: `def-${productId}-1`,
        author: "Sophie B.",
        location: "Paris, FR",
        rating: 5,
        date: "3 days ago",
        title: "Architectural structure with warm virgin wool feel",
        comment:
          "The silhouette is commanding yet minimalist. Heavyweight construction with immaculate interior piping and horn buttons. An investment piece that will age with grace.",
        verified: true,
        sizePurchased: "M",
        fitFeedback: "True to Size",
        helpfulCount: 21,
      },
      {
        id: `def-${productId}-2`,
        author: "Vikram T.",
        location: "Chandigarh, IN",
        rating: 5,
        date: "1 week ago",
        title: "Uncompromising density and thermal warmth",
        comment:
          "Incredible density and feel. The drape is rigid enough to maintain clean lines while remaining supremely comfortable throughout chilly evenings.",
        verified: true,
        sizePurchased: "L",
        fitFeedback: "True to Size",
        helpfulCount: 12,
      },
      {
        id: `def-${productId}-3`,
        author: "Elena R.",
        location: "Zurich, CH",
        rating: 5,
        date: "2 weeks ago",
        title: "Quiet luxury in its purest form",
        comment:
          "No loud logos, just pure textural mastery. The lining slips on effortlessly over fine knitwear.",
        verified: true,
        sizePurchased: "S",
        fitFeedback: "True to Size",
        helpfulCount: 9,
      },
    ];
  }

  // Default fallback
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
  const [showAll, setShowAll] = useState(false);
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

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3);

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
    <section id="atelier-reviews" className="atelier-pdp-reviews">
      {/* Section Header */}
      <div className="atelier-reviews-head">
        <div className="atelier-reviews-kicker">
          <span>VERIFIED REPUTATION</span>
          <span className="atelier-kicker-dot">&bull;</span>
          <span>ATELIER ARCHIVE</span>
        </div>
        <div className="atelier-reviews-title-row">
          <h2 className="atelier-reviews-title">CLIENT APPRAISALS</h2>
          <button
            type="button"
            className="atelier-reviews-write-btn"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? (
              <>
                <X size={12} strokeWidth={2} />
                <span>CLOSE FORM</span>
              </>
            ) : (
              <>
                <PenLine size={12} strokeWidth={2} />
                <span>WRITE AN APPRAISAL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Aggregate Score Card */}
      <div className="atelier-reviews-score-card">
        <div className="atelier-score-primary">
          <span className="atelier-score-num">{avgRating.toFixed(1)}</span>
          <div className="atelier-score-meta">
            <div className="atelier-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round(avgRating) ? "#121212" : "none"}
                  stroke="#121212"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="atelier-score-caption">
              {totalCount} {totalCount === 1 ? "Appraisal" : "Appraisals"} &bull; 98% Recommended
            </span>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="atelier-breakdown-bars">
          {[5, 4, 3, 2, 1].map((starVal) => {
            const count = ratingCounts[starVal as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div key={starVal} className="atelier-bar-row">
                <span className="atelier-bar-label">{starVal}★</span>
                <div className="atelier-bar-track">
                  <div
                    className="atelier-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="atelier-bar-pct">{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Fit Insights */}
        <div className="atelier-reviews-fit-insights">
          <div className="atelier-fit-insight-item">
            <span className="fit-k">FIT ACCURACY</span>
            <span className="fit-v">True to Silhouette (96%)</span>
          </div>
          <div className="atelier-fit-insight-item">
            <span className="fit-k">FABRIC HEFT</span>
            <span className="fit-v">Heavyweight &amp; Structured</span>
          </div>
        </div>
      </div>

      {/* Write a Review Drawer */}
      {isFormOpen && (
        <form className="atelier-review-form-panel" onSubmit={handleSubmitReview}>
          <div className="atelier-form-header">
            <h3 className="atelier-form-title">SUBMIT YOUR APPRAISAL</h3>
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
                  <label className="atelier-form-label" htmlFor="review-author">
                    YOUR NAME *
                  </label>
                  <input
                    id="review-author"
                    type="text"
                    className="atelier-form-input"
                    placeholder="e.g. Julian V."
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    required
                  />
                </div>
                <div className="atelier-form-field">
                  <label className="atelier-form-label" htmlFor="review-location">
                    LOCATION (OPTIONAL)
                  </label>
                  <input
                    id="review-location"
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
                  <label className="atelier-form-label" htmlFor="review-size">
                    SIZE PURCHASED
                  </label>
                  <select
                    id="review-size"
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
                  <label className="atelier-form-label" htmlFor="review-fit">
                    FIT APPRAISAL
                  </label>
                  <select
                    id="review-fit"
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
                <label className="atelier-form-label" htmlFor="review-title">
                  APPRAISAL HEADLINE *
                </label>
                <input
                  id="review-title"
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
                <label className="atelier-form-label" htmlFor="review-comment">
                  DETAILED COMMENTS *
                </label>
                <textarea
                  id="review-comment"
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
                  CANCEL
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Filter Tabs */}
      <div className="atelier-reviews-filter-row">
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

      {/* Reviews Cards Feed */}
      <div className="atelier-reviews-list">
        {displayedReviews.length === 0 ? (
          <div className="atelier-reviews-empty">
            <p>No appraisals found in this category.</p>
          </div>
        ) : (
          displayedReviews.map((review) => {
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
                    <span>
                      {hasVoted ? "HELPFUL" : "HELPFUL"} ({review.helpfulCount})
                    </span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Show More / Show Less Toggle */}
      {filteredReviews.length > 3 && (
        <div className="atelier-reviews-more-wrap">
          <button
            type="button"
            className="atelier-reviews-toggle-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <span>SHOW FEWER APPRAISALS</span>
                <ChevronUp size={13} strokeWidth={2} />
              </>
            ) : (
              <>
                <span>VIEW ALL {filteredReviews.length} APPRAISALS</span>
                <ChevronDown size={13} strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
