"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle, Quote } from "lucide-react";

export interface TestimonialItem {
  id: string;
  author: string;
  location: string;
  initials: string;
  rating: number;
  product: string;
  headline: string;
  comment: string;
  date: string;
}

export default function StreetwearTestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reviews", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load reviews");
        return response.json();
      })
      .then((data) => {
        const reviews: Array<{
          id: string;
          verified?: boolean;
          author?: string;
          location?: string;
          rating?: number;
          product_name?: string;
          title?: string;
          comment?: string;
          date?: string;
          created_at?: string;
        }> = Array.isArray(data.reviews) ? data.reviews : [];
        setTestimonials(reviews.filter((review) => review.verified === true).map((review) => {
          const author = typeof review.author === "string" && review.author.trim() ? review.author.trim() : "Verified customer";
          const initials = author.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
          return {
            id: String(review.id),
            author,
            location: review.location || "India",
            initials: initials || "VC",
            rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
            product: review.product_name || "",
            headline: review.title || "Verified purchase",
            comment: review.comment || "",
            date: review.date || (review.created_at ? new Date(review.created_at).toLocaleDateString("en-IN") : ""),
          };
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Unable to load customer reviews.", error);
      });
    return () => controller.abort();
  }, []);

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch || testimonials.length < 2) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    // A right swipe advances to the next testimonial; a left swipe goes back.
    const direction = deltaX > 0 ? 1 : -1;
    setActiveTestimonialIndex((current) =>
      (current + direction + testimonials.length) % testimonials.length
    );
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="streetwear-testimonials-section">
      <div className="streetwear-testimonials-container">
        {/* Section Header */}
        <div className="streetwear-testimonials-header">
          <h2 className="streetwear-testimonials-title">TESTIMONIALS</h2>
        </div>

        {/* Testimonials Grid: 3 cards on desktop, responsive stack/slider on mobile */}
        <div
          className="streetwear-testimonials-grid"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-live="polite"
        >
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`streetwear-testimonial-card ${activeTestimonialIndex === idx ? "is-active" : ""}`}
            >
              {/* Card Top: Stars + Verified Badge */}
              <div className="streetwear-testimonial-top">
                <div className="streetwear-card-stars">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="#111111"
                      color="#111111"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <div className="streetwear-verified-badge">
                  <CheckCircle size={13} strokeWidth={2.2} />
                  <span>VERIFIED BUYER</span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="streetwear-testimonial-headline">
                “{item.headline}”
              </h3>

              {/* Review Text */}
              <p className="streetwear-testimonial-comment">{item.comment}</p>

              {/* Purchased Product Tag */}
              <div className="streetwear-testimonial-product">
                <span className="streetwear-product-tag-label">PIECE:</span>
                <span className="streetwear-product-tag-name">{item.product}</span>
              </div>

              {/* Author Footer */}
              <div className="streetwear-testimonial-footer">
                <div className="streetwear-author-avatar">{item.initials}</div>
                <div className="streetwear-author-info">
                  <span className="streetwear-author-name">{item.author}</span>
                  <span className="streetwear-author-meta">
                    {item.location} • {item.date}
                  </span>
                </div>
                <Quote size={20} className="streetwear-quote-watermark" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="streetwear-testimonials-pagination" role="group" aria-label="Choose a testimonial">
          {testimonials.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`streetwear-testimonials-dot ${activeTestimonialIndex === idx ? "active" : ""}`}
              onClick={() => setActiveTestimonialIndex(idx)}
              aria-label={`Show testimonial ${idx + 1}`}
              aria-current={activeTestimonialIndex === idx ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
