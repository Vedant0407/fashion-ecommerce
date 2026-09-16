"use client";

import { motion } from "motion/react";
import React from "react";

const EDITORIAL_PHOTOS = [
  {
    id: "forest-road",
    img: "/editorial-forest-road.jpg",
    span: "editorial-card-wide",
  },
  {
    id: "misty-forest",
    img: "/editorial-misty-forest.jpg",
    span: "editorial-card-narrow",
  },
  {
    id: "cottage",
    img: "/editorial-cottage.jpg",
    span: "editorial-card-narrow",
  },
  {
    id: "river-mountain",
    img: "/editorial-river-mountain.jpg",
    span: "editorial-card-wide",
  },
];

export default function ConditionGrid() {
  return (
    <section className="editorial-mood-section">
      <div className="editorial-mood-container">
        <div className="editorial-mood-grid">
          {EDITORIAL_PHOTOS.map((photo, index) => (
            <motion.article
              key={photo.id}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ ease: "easeOut", duration: 0.55, delay: index * 0.08 }}
              viewport={{ once: true }}
              className={`editorial-card-wrap ${photo.span}`}
            >
              <div className="editorial-card-inner">
                <img
                  src={photo.img}
                  alt="Atelier Moodboard"
                  className="editorial-img"
                  loading="lazy"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export { ConditionGrid };
