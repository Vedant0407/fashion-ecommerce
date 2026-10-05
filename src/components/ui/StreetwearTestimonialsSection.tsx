"use client";

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

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "test-1",
    author: "Aarav M.",
    location: "Mumbai, IN",
    initials: "AM",
    rating: 5,
    product: "WASHED TEE GREEN",
    headline: "The collar structure and drop shoulders are flawless.",
    comment:
      "Honestly blown away by the fabric weight. The 300gsm combed cotton feels substantial with a natural architectural drape, and the wash gives it an understated vintage look out of the box.",
    date: "Verified 3 days ago",
  },
  {
    id: "test-2",
    author: "Marcus K.",
    location: "London, UK",
    initials: "MK",
    rating: 5,
    product: "OVERSIZED TEE BLACK",
    headline: "Rivals luxury European streetwear houses.",
    comment:
      "The boxy drape sits exactly right over tailored pants or cargos. After 10+ washes, the collar remains crisp and the deep noir color hasn't faded. An absolute daily staple.",
    date: "Verified 1 week ago",
  },
  {
    id: "test-3",
    author: "Dev R.",
    location: "New Delhi, IN",
    initials: "DR",
    rating: 5,
    product: "TAILORED POPLIN SHIRT",
    headline: "Immaculate craftsmanship at an unbelievable level.",
    comment:
      "Mother of pearl buttons and clean French seams. Wore it to a gallery opening and got asked where it was from multiple times. The silhouette speaks for itself without loud logos.",
    date: "Verified 2 weeks ago",
  },
];

export default function StreetwearTestimonialsSection() {
  return (
    <section className="streetwear-testimonials-section">
      <div className="streetwear-testimonials-container">
        {/* Section Header */}
        <div className="streetwear-testimonials-header">
          <span className="streetwear-testimonials-tag">COMMUNITY // 05</span>
          <h2 className="streetwear-testimonials-title">TESTIMONIALS</h2>

          {/* Social Proof Star Rating */}
          <div className="streetwear-testimonials-rating-bar">
            <div className="streetwear-testimonials-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill="#111111"
                  color="#111111"
                  strokeWidth={0}
                />
              ))}
            </div>
            <span className="streetwear-testimonials-rating-text">
              <strong>4.9 / 5.0</strong> FROM OVER 1,500+ VERIFIED PATRONS
            </span>
          </div>
        </div>

        {/* Testimonials Grid: 3 cards on desktop, responsive stack/slider on mobile */}
        <div className="streetwear-testimonials-grid">
          {TESTIMONIALS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="streetwear-testimonial-card"
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
      </div>
    </section>
  );
}
