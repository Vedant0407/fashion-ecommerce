"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowUpRight, Volume2, VolumeX, Pause, Play, Sparkles } from "lucide-react";
import { StoreStory } from "@/lib/store-data";

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoreStory[];
  initialIndex?: number;
}

export default function StoryViewerModal({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const activeStories = stories.filter((s) => s.active);
  const currentStory = activeStories[currentIndex] || activeStories[0];
  const duration = (currentStory?.duration || 5) * 1000; // ms

  const isVideo = Boolean(
    currentStory?.image &&
      (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(currentStory.image) ||
        currentStory.image.startsWith("data:video"))
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, currentIndex]);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);

  // Sync index if initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(initialIndex, Math.max(0, activeStories.length - 1)));
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [isOpen, initialIndex, activeStories.length]);

  // Track views
  useEffect(() => {
    if (isOpen && currentStory?.id) {
      fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: currentStory.id }),
      }).catch(() => {});
    }
  }, [isOpen, currentStory?.id]);

  const handleNext = useCallback(() => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [currentIndex, activeStories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      // Restart current story
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [currentIndex]);

  // Progress Bar Timer Loop
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPct = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentPct);

      if (currentPct >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        handleNext();
      }
    }, 30);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, currentStory, isPaused, duration, handleNext]);

  // Handle pause on hold
  const handleHoldStart = () => {
    isHoldingRef.current = true;
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    setIsPaused(true);
  };

  const handleHoldEnd = () => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;
      setIsPaused(false);
    }
  };

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  if (activeStories.length === 0 || !currentStory) {
    return (
      <div
        className="story-viewer-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <button
          type="button"
          className="story-viewer-outer-close"
          onClick={onClose}
          aria-label="Close stories"
        >
          <X size={24} />
        </button>

        <div
          className="story-card-wrapper"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "36px 24px",
            textAlign: "center",
            background: "#121212",
            color: "#ffffff",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            ATELIER STORIES
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.65)",
              lineHeight: "1.6",
              maxWidth: "280px",
              marginBottom: "28px",
            }}
          >
            No live stories published yet. Upload vertical photos or video reels from the Admin Console to feature them here.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#ffffff",
              color: "#121212",
              border: "none",
              padding: "12px 28px",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderRadius: "24px",
              cursor: "pointer",
            }}
          >
            CLOSE VIEWER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="story-viewer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Outer Close Button */}
      <button
        type="button"
        className="story-viewer-outer-close"
        onClick={onClose}
        aria-label="Close stories"
      >
        <X size={24} />
      </button>

      {/* Desktop Previous Arrow */}
      {currentIndex > 0 && (
        <button
          type="button"
          className="story-nav-btn prev"
          onClick={handlePrev}
          aria-label="Previous story"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Main Story Container (9:16 vertical ratio) */}
      <div
        className={`story-card-wrapper ${isPaused ? "paused" : ""}`}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      >
        {/* Story Media */}
        <div className="story-media-box">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.image}
              autoPlay
              playsInline
              muted={isMuted}
              loop
              className="story-media-image"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={currentStory.image}
              alt={currentStory.title}
              className="story-media-image"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop";
              }}
            />
          )}
          <div className="story-scrim-top" />
          <div className="story-scrim-bottom" />
        </div>

        {/* Tap Interaction Areas */}
        <div
          className="story-tap-area left"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous story segment"
        />
        <div
          className="story-tap-area right"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next story segment"
        />

        {/* Top Header Chrome */}
        <div className="story-header-chrome">
          {/* Progress Segment Bars */}
          <div className="story-progress-segments">
            {activeStories.map((s, idx) => {
              let fill = 0;
              if (idx < currentIndex) fill = 100;
              else if (idx === currentIndex) fill = progress;
              return (
                <div key={s.id || idx} className="story-segment-track">
                  <div
                    className="story-segment-fill"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Account Profile Line */}
          <div className="story-profile-row">
            <div className="story-profile-left">
              <div className="story-avatar-badge">
                <Sparkles size={14} color="#121212" strokeWidth={2.4} />
              </div>
              <div className="story-profile-text">
                <span className="story-brand-title">GREENO ATELIER</span>
                <span className="story-meta-time">
                  {currentStory.order_index === 0 ? "NOW PLAYING" : `PART ${currentIndex + 1} OF ${activeStories.length}`}
                </span>
              </div>
            </div>

            <div className="story-header-controls">
              {isVideo && (
                <button
                  type="button"
                  className="story-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((m) => !m);
                  }}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              )}
              <button
                type="button"
                className="story-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((p) => !p);
                }}
                aria-label={isPaused ? "Resume story" : "Pause story"}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
              </button>
              <button
                type="button"
                className="story-icon-btn close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close story"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Caption & Product Link Card */}
        <div className="story-bottom-card" onClick={(e) => e.stopPropagation()}>
          <div className="story-badge-row">
            <span className="story-curated-badge">EXCLUSIVE ATELIER DROP</span>
          </div>

          <h3 className="story-title-text">{currentStory.title}</h3>

          {currentStory.caption && (
            <p className="story-caption-text">{currentStory.caption}</p>
          )}

          {currentStory.link_url && (
            <div className="story-cta-row">
              <Link
                href={currentStory.link_url}
                className="story-cta-button"
                onClick={() => onClose()}
              >
                <span>{currentStory.link_text || "EXPLORE PIECE"}</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Next Arrow */}
      {currentIndex < activeStories.length - 1 && (
        <button
          type="button"
          className="story-nav-btn next"
          onClick={handleNext}
          aria-label="Next story"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );
}
