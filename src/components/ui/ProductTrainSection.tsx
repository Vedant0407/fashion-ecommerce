"use client";

import { useRef, useState } from "react";

export interface TrainPhoto {
  id: string;
  image: string;
  alt: string;
}

export const TRAIN_PHOTOS: TrainPhoto[] = [
  {
    id: "photo-black-tee",
    image: "/train-black-tee.jpg",
    alt: "Heavyweight Boxy Tee Look",
  },
  {
    id: "photo-blue-tee",
    image: "/train-blue-tee.jpg",
    alt: "Vintage Slate Blue Tee Look",
  },
  {
    id: "photo-olive-tee",
    image: "/train-olive-tee.jpg",
    alt: "Earthy Olive Washed Tee Look",
  },
  {
    id: "photo-poplin-shirt",
    image: "/atelier-shirt.jpg",
    alt: "Tailored Poplin Shirt Look",
  },
  {
    id: "photo-oxford-shirt",
    image: "/atelier-oxford-shirt.jpg",
    alt: "Charcoal Oxford Overshirt Look",
  },
  {
    id: "photo-white-tee",
    image: "/atelier-white-tee.jpg",
    alt: "Minimalist Chalk Tee Look",
  },
  {
    id: "photo-boxy-tee",
    image: "/atelier-tshirt.jpg",
    alt: "Heavyweight Boxy Silhouette",
  },
];

export default function ProductTrainSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Triple items for continuous seamless looping train
  const items = [...TRAIN_PHOTOS, ...TRAIN_PHOTOS, ...TRAIN_PHOTOS];

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section id="product-train-section" className="product-train-section showpiece-only">
      {/* Visual Showpiece Photo Train (No headers, no sell buttons, pure photos) */}
      <div
        className="product-train-viewport"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          handleMouseUpOrLeave();
        }}
      >
        <div
          ref={scrollContainerRef}
          className={`product-train-track ${isPaused ? "train-paused" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="product-train-photo-item"
            >
              <div className="product-train-photo-box">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="product-train-pure-img"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
