"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface ImageSwiperProps {
  images: string;
  cardWidth?: number;
  cardHeight?: number;
  className?: string;
}

export const ImageSwiper: React.FC<ImageSwiperProps> = ({
  images,
  cardWidth = 420,
  cardHeight = 560,
  className = "",
}) => {
  const imageList = images
    .split(",")
    .map((img) => img.trim())
    .filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);

  const startX = useRef(0);
  const currentX = useRef(0);
  const dragging = useRef(false);

  const [dragX, setDragX] = useState(0);

  const nextImage = useCallback(() => {
    setDragX(0);

    setCurrentIndex((prev) =>
      imageList.length ? (prev + 1) % imageList.length : 0
    );
  }, [imageList.length]);

  const previousImage = useCallback(() => {
    setDragX(0);

    setCurrentIndex((prev) =>
      imageList.length
        ? (prev - 1 + imageList.length) % imageList.length
        : 0
    );
  }, [imageList.length]);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    dragging.current = true;
    startX.current = e.clientX;
    currentX.current = e.clientX;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging.current) return;

    currentX.current = e.clientX;

    const distance = currentX.current - startX.current;

    setDragX(distance);
  };

  const handlePointerUp = () => {
    if (!dragging.current) return;

    dragging.current = false;

    const distance = currentX.current - startX.current;

    if (Math.abs(distance) > 80) {
      if (distance < 0) {
        nextImage();
      } else {
        previousImage();
      }
    } else {
      setDragX(0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextImage();
      }

      if (e.key === "ArrowLeft") {
        previousImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextImage, previousImage]);

  if (!imageList.length) {
    return null;
  }

  const rotation = dragX * 0.04;
  const opacity =
    1 - Math.min(Math.abs(dragX) / 500, 0.35);

  return (
    <div
      className={`product-image-swiper ${className}`}
      style={{
        width: cardWidth + 100,
        height: cardHeight + 80,
        position: "relative",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      {/* BACK IMAGE */}
      {imageList.length > 1 && (
        <div
          className="swiper-back-image"
          style={{
            position: "absolute",
            width: cardWidth,
            height: cardHeight,
            left: "50%",
            top: "50%",
            transform:
              "translate(-50%, -50%) translateX(28px) scale(0.94)",
            opacity: 0.35,
            zIndex: 1,
            transition:
              "transform 0.45s cubic-bezier(.22,.61,.36,1)",
            overflow: "hidden",
          }}
        >
          <img
            src={imageList[(currentIndex + 1) % imageList.length]}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* MAIN IMAGE */}
      <div
        className="swiper-main-image"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: "absolute",
          width: cardWidth,
          height: cardHeight,
          left: "50%",
          top: "50%",
          transform: `
            translate(-50%, -50%)
            translateX(${dragX}px)
            rotate(${rotation}deg)
          `,
          opacity,
          zIndex: 5,
          cursor: dragging.current
            ? "grabbing"
            : "grab",
          transition: dragging.current
            ? "none"
            : "transform 0.45s cubic-bezier(.22,.61,.36,1), opacity 0.45s ease",
          overflow: "hidden",
        }}
      >
        <img
          src={imageList[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* IMAGE COUNTER */}
      {imageList.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "7px",
            zIndex: 10,
          }}
        >
          {imageList.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setDragX(0);
              }}
              aria-label={`View image ${index + 1}`}
              style={{
                width: index === currentIndex ? 22 : 7,
                height: 7,
                borderRadius: 999,
                border: "none",
                padding: 0,
                background:
                  index === currentIndex
                    ? "#111"
                    : "#bbb",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};