"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowUpRight, Volume2, VolumeX, Pause, Play, Sparkles } from "lucide-react";
import { type StoreStory } from "@/lib/story-constants";

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
  // Use real active stories only - do not resurrect deleted default stories
  const activeStories = (stories && stories.length > 0) ? stories.filter((s) => s.active) : [];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);

  const currentStory = activeStories[currentIndex] || activeStories[0];
  const configuredDuration = (currentStory?.duration || 5) * 1000;
  const effectiveDuration = videoDurationMs || configuredDuration;

  const isVideo = Boolean(
    currentStory?.image &&
      (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(currentStory.image) ||
        currentStory.image.startsWith("data:video"))
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  // Pointer tracking for tap vs hold
  const pointerDownTimeRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset progress and video on slide change
  useEffect(() => {
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
    setVideoDurationMs(null);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPaused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex]);

  // Video play/pause effect
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused || isHolding) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isHolding]);

  // Sync index when modal opens
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.min(Math.max(0, initialIndex), activeStories.length - 1);
      setCurrentIndex(validIndex);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
      setIsPaused(false);
      setIsHolding(false);
    }
  }, [isOpen, initialIndex, activeStories.length]);

  // Track impressions
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
    } else {
      onClose();
    }
  }, [currentIndex, activeStories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      // Replay current
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [currentIndex]);

  // Progress Bar Timer Loop
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || isHolding) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPct = Math.min((elapsed / effectiveDuration) * 100, 100);
      setProgress(currentPct);

      if (currentPct >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        handleNext();
      }
    }, 25);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, currentStory, isPaused, isHolding, effectiveDuration, handleNext]);

  // Pointer interactions (Hold to pause vs Tap to navigate)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) {
      return;
    }
    pointerDownTimeRef.current = Date.now();
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    setIsHolding(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) {
      return;
    }
    const holdDuration = Date.now() - pointerDownTimeRef.current;
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);

    setIsHolding(false);
    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    // If hold was longer than 220ms or user dragged, it was a hold/drag — DO NOT ADVANCE!
    if (holdDuration > 220 || dx > 25 || dy > 25) {
      return;
    }

    // It was a crisp intentional tap: determine left 30% vs right 70%
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX < rect.width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const handlePointerCancel = () => {
    setIsHolding(false);
    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;
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

  // Sanitize deep links so /product/ automatically becomes /products/
  const cleanLinkUrl = currentStory?.link_url
    ? currentStory.link_url.replace(/^\/product\//, "/products/")
    : undefined;

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

      {/* Main Story Card (9:16 vertical ratio) */}
      <div
        className={`story-card-wrapper ${isHolding ? "holding" : ""} ${isPaused ? "paused" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Story Media Box */}
        <div className="story-media-box">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.image}
              autoPlay
              playsInline
              muted={isMuted}
              loop={false}
              className="story-media-image"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (d && !isNaN(d) && d > 0) {
                  setVideoDurationMs(Math.round(d * 1000));
                }
              }}
              onEnded={() => {
                handleNext();
              }}
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

        {/* Top Header Chrome */}
        <div
          className="story-header-chrome"
          onPointerDown={(e) => e.stopPropagation()}
        >
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
        <div
          className="story-bottom-card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="story-badge-row">
            <span className="story-curated-badge">EXCLUSIVE ATELIER DROP</span>
          </div>

          <h3 className="story-title-text">{currentStory.title}</h3>

          {currentStory.caption && (
            <p className="story-caption-text">{currentStory.caption}</p>
          )}

          {cleanLinkUrl && (
            <div className="story-cta-row">
              <Link
                href={cleanLinkUrl}
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
