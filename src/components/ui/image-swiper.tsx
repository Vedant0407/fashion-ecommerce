"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface ImageSwiperProps {
  images: string;
  cardWidth?: number;
  cardHeight?: number;
  className?: string;
  onImageClick?: (index: number) => void;
}

export const ImageSwiper: React.FC<ImageSwiperProps> = ({
  images,
  cardWidth = 420,
  cardHeight = 560,
  className = "",
  onImageClick,
}) => {
  const imageList = images
    .split(",")
    .map((img) => img.trim())
    .filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);

  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);
  const isHorizontalSwipe = useRef(false);
  const isVerticalScroll = useRef(false);
  const capturedPointerId = useRef<number | null>(null);

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
    startY.current = e.clientY;
    currentX.current = e.clientX;
    currentY.current = e.clientY;
    isHorizontalSwipe.current = false;
    isVerticalScroll.current = false;
    capturedPointerId.current = null;

    // For mouse drag on desktop, capture pointer for smooth drag interaction
    if (e.pointerType === "mouse") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        capturedPointerId.current = e.pointerId;
      } catch {}
    }
    // IMPORTANT: For touch on mobile, do NOT call setPointerCapture on pointerdown!
    // Capturing touch immediately intercepts and cancels browser native vertical page scrolling.
  };

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging.current) return;
    if (isVerticalScroll.current) return;

    currentX.current = e.clientX;
    currentY.current = e.clientY;

    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;

    // On touch devices, detect whether gesture is vertical page scroll or horizontal card swipe
    if (e.pointerType === "touch" && !isHorizontalSwipe.current) {
      // If vertical movement exceeds 6px and vertical >= horizontal: it's a page scroll!
      if (Math.abs(deltaY) > 6 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        isVerticalScroll.current = true;
        setDragX(0);
        return;
      }

      // If horizontal movement exceeds 10px and horizontal movement dominates: it's a card swipe!
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        isHorizontalSwipe.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
          capturedPointerId.current = e.pointerId;
        } catch {}
      } else {
        return;
      }
    }

    if (isHorizontalSwipe.current || e.pointerType === "mouse") {
      setDragX(deltaX);
    }
  };

  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging.current) return;

    dragging.current = false;

    // Release pointer capture if held
    if (capturedPointerId.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(capturedPointerId.current)) {
          e.currentTarget.releasePointerCapture(capturedPointerId.current);
        }
      } catch {}
      capturedPointerId.current = null;
    }

    const distanceX = currentX.current - startX.current;
    const distanceY = currentY.current - startY.current;

    // If user scrolled vertically, completely ignore and reset
    if (isVerticalScroll.current || Math.abs(distanceY) > 8) {
      setDragX(0);
      isVerticalScroll.current = false;
      isHorizontalSwipe.current = false;
      return;
    }

    if (Math.abs(distanceX) > 60) {
      if (distanceX < 0) {
        nextImage();
      } else {
        previousImage();
      }
    } else {
      // Stationary tap / click check
      if (Math.abs(distanceX) < 8 && Math.abs(distanceY) < 8) {
        // On mobile or touch devices: DO NOT open image modal on touching the photo!
        // Tapping/dragging on phone screen must never accidentally pop the lightbox.
        // Users on mobile can tap the explicit zoom icon button in the bottom right corner.
        const isMobileScreen =
          typeof window !== "undefined" && window.innerWidth <= 768;
        if (!isMobileScreen && e.pointerType !== "touch") {
          onImageClick?.(currentIndex);
        }
      }
      setDragX(0);
    }

    isHorizontalSwipe.current = false;
    isVerticalScroll.current = false;
  };

  const handlePointerCancel = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    dragging.current = false;
    isVerticalScroll.current = false;
    isHorizontalSwipe.current = false;
    setDragX(0);

    if (capturedPointerId.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(capturedPointerId.current)) {
          e.currentTarget.releasePointerCapture(capturedPointerId.current);
        }
      } catch {}
      capturedPointerId.current = null;
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
        width: `var(--swiper-w, ${cardWidth + 100}px)`,
        height: `var(--swiper-h, ${cardHeight + 80}px)`,
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
            width: `var(--swiper-card-w, ${cardWidth}px)`,
            height: `var(--swiper-card-h, ${cardHeight}px)`,
            left: "50%",
            top: "50%",
            touchAction: "pan-y",
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
        onPointerCancel={handlePointerCancel}
        style={{
          position: "absolute",
          width: `var(--swiper-card-w, ${cardWidth}px)`,
          height: `var(--swiper-card-h, ${cardHeight}px)`,
          left: "50%",
          top: "50%",
          touchAction: "pan-y",
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

        {onImageClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(currentIndex);
            }}
            title="Click to view full box & zoom"
            aria-label="Expand image"
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#111111",
              cursor: "pointer",
              zIndex: 10,
              transition: "all 0.2s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        )}
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