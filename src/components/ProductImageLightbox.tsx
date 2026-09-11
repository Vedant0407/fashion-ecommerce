"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface ProductImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName?: string;
}

export default function ProductImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName = "Product",
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const hasDraggedRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    if (!images.length) return;
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (!images.length) return;
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation (Esc, Left, Right)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // PREVENT BROWSER ZOOM & BACKGROUND SCROLLING
  // Native non-passive listener intercepts Ctrl+wheel / pinch gestures so only the image zooms and never the website
  useEffect(() => {
    if (!isOpen) return;

    const handlePreventBrowserCtrlZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handlePreventBrowserCtrlZoom, { passive: false });
    return () => {
      window.removeEventListener("wheel", handlePreventBrowserCtrlZoom);
    };
  }, [isOpen]);

  // Attach non-passive wheel handler directly to the stage for smooth image-only zoom
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || !isOpen) return;

    const onStageWheel = (e: WheelEvent) => {
      // Strictly prevent browser page zoom and page scroll
      e.preventDefault();
      e.stopPropagation();

      // Damped, gentle zoom sensitivity (prevents fast jumps)
      const rawDelta = -e.deltaY;
      const step = Math.min(Math.max(rawDelta * 0.0008, -0.08), 0.08);

      setZoomScale((prev) => {
        const next = Math.min(Math.max(prev + step, 1), 2.8);
        if (next <= 1.02) {
          setPanPosition({ x: 0, y: 0 });
          return 1;
        }
        return Number(next.toFixed(3));
      });
    };

    stageEl.addEventListener("wheel", onStageWheel, { passive: false });
    return () => {
      stageEl.removeEventListener("wheel", onStageWheel);
    };
  }, [isOpen]);

  // Prevent background scroll when scrolling over backdrop
  useEffect(() => {
    const backdropEl = backdropRef.current;
    if (!backdropEl || !isOpen) return;

    const onBackdropWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    backdropEl.addEventListener("wheel", onBackdropWheel, { passive: false });
    return () => {
      backdropEl.removeEventListener("wheel", onBackdropWheel);
    };
  }, [isOpen]);

  // Click image to toggle 1x / 2x zoom (only if user didn't drag)
  const handleImageClick = () => {
    if (hasDraggedRef.current) return;

    if (zoomScale > 1) {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      setZoomScale(2);
    }
  };

  // Pan / drag when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    hasDraggedRef.current = false;
    if (zoomScale <= 1) return;

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panPosition.x,
      startPanY: panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoomScale <= 1) return;

    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true;
    }

    setPanPosition({
      x: panStartRef.current.startPanX + dx,
      y: panStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      ref={backdropRef}
      className="product-lightbox-backdrop"
      onClick={onClose}
    >
      {/* Floating Small Box Modal */}
      <div
        className="product-lightbox-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar: Clean & Minimal (NO zoom control bar widget) */}
        <div className="product-lightbox-topbar">
          <div className="product-lightbox-title-area">
            <span className="product-lightbox-tag">
              {productName || "PRODUCT VIEW"}
            </span>
            <span className="product-lightbox-counter">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="product-lightbox-close-btn"
            aria-label="Close image preview"
            title="Close (Esc)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Main Image Stage */}
        <div
          ref={stageRef}
          className="product-lightbox-stage"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor:
              zoomScale > 1
                ? isPanning
                  ? "grabbing"
                  : "grab"
                : "zoom-in",
          }}
        >
          {/* Left Arrow Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="product-lightbox-arrow arrow-left"
              aria-label="Previous image"
              title="Previous image (Left arrow)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Centered Image - Scales and Pans ONLY within this container */}
          <div
            className="product-lightbox-img-wrapper"
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
              transition: isPanning ? "none" : "transform 0.18s ease-out",
            }}
            onClick={handleImageClick}
          >
            <img
              src={currentImage}
              alt={`${productName} view ${currentIndex + 1}`}
              draggable={false}
              className="product-lightbox-img"
            />
          </div>

          {/* Right Arrow Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="product-lightbox-arrow arrow-right"
              aria-label="Next image"
              title="Next image (Right arrow)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Minimal Subtle Floating Hint */}
          <div className="product-lightbox-hint">
            {zoomScale > 1
              ? "Drag to explore • Click to reset"
              : "Click to zoom • Scroll to adjust"}
          </div>
        </div>

        {/* Bottom Thumbnail Strip */}
        {images.length > 1 && (
          <div className="product-lightbox-thumbnails">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className={`product-lightbox-thumb-btn ${
                  idx === currentIndex ? "active" : ""
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt="" className="product-lightbox-thumb-img" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
