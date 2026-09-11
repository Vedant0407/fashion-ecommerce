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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleToggleZoom = () => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      setZoomScale(2);
    }
  };

  // Keyboard navigation & Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(prev + 0.25, 3));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Pan when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
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
    <div className="product-lightbox-backdrop" onClick={onClose}>
      {/* Floating Small Box Modal */}
      <div
        className="product-lightbox-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar */}
        <div className="product-lightbox-topbar">
          <div className="product-lightbox-title-area">
            <span className="product-lightbox-tag">PRODUCT VIEW</span>
            <span className="product-lightbox-counter">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="product-lightbox-zoom-bar">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              className="lightbox-zoom-btn"
              title="Zoom out (-)"
              aria-label="Zoom out"
            >
              &minus;
            </button>
            <span
              className="lightbox-zoom-val"
              onClick={handleToggleZoom}
              title="Click to toggle 2x zoom"
            >
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 3}
              className="lightbox-zoom-btn"
              title="Zoom in (+)"
              aria-label="Zoom in"
            >
              &#43;
            </button>
            {zoomScale > 1 && (
              <button
                type="button"
                onClick={() => {
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className="lightbox-reset-btn"
                title="Reset zoom"
              >
                Reset
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="product-lightbox-close-btn"
            aria-label="Close image preview"
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
          ref={containerRef}
          className="product-lightbox-stage"
          onWheel={handleWheel}
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

          {/* Centered Image */}
          <div
            className="product-lightbox-img-wrapper"
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
              transition: isPanning ? "none" : "transform 0.22s ease-out",
            }}
            onClick={handleToggleZoom}
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

          {/* Hint Overlay */}
          <div className="product-lightbox-hint">
            {zoomScale > 1 ? "Drag to pan • Click to reset" : "Click to zoom 2x • Scroll to zoom"}
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
