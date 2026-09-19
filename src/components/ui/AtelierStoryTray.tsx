"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { type StoreStory } from "@/lib/story-constants";
import StoryViewerModal from "@/components/ui/StoryViewerModal";

export default function AtelierStoryTray() {
  const [stories, setStories] = useState<StoreStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadStories() {
      try {
        const res = await fetch(`/api/stories?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.stories && Array.isArray(data.stories)) {
            setStories(data.stories);
          }
        }
      } catch (err) {
        // Keeps stories
      }
    }

    loadStories();

    const handleUpdated = () => loadStories();
    window.addEventListener("greeno_stories_updated", handleUpdated);
    window.addEventListener("focus", handleUpdated);

    return () => {
      window.removeEventListener("greeno_stories_updated", handleUpdated);
      window.removeEventListener("focus", handleUpdated);
    };
  }, []);

  const activeStories = stories.filter((s) => s.active);
  const displayStories = activeStories;

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <>
      <section className="atelier-story-tray-section" aria-label="Atelier Stories">
        <div className="atelier-story-tray-inner">
          <div className="atelier-story-tray-header">
            <div className="atelier-story-tray-tag">
              <Sparkles size={11} className="story-tray-sparkle" />
              <span>ATELIER EDITORIAL REELS</span>
            </div>
            <div className="atelier-story-tray-sub">
              Tap to view full-screen vertical stories & explore direct drop silhouettes
            </div>
          </div>

          <div className="atelier-story-scroll-container">
            {displayStories.map((story, index) => {
              const isVideo = Boolean(
                story.image &&
                  (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(story.image) ||
                    story.image.startsWith("data:video"))
              );

              return (
                <button
                  key={story.id || index}
                  type="button"
                  className="atelier-story-bubble-btn"
                  onClick={() => handleOpenStory(index)}
                  aria-label={`View story: ${story.title}`}
                >
                  <div className="atelier-story-bubble-ring">
                    <div className="atelier-story-bubble-media">
                      {isVideo ? (
                        <video
                          src={story.image}
                          muted
                          playsInline
                          loop
                          autoPlay
                          className="atelier-story-bubble-thumb"
                        />
                      ) : (
                        <img
                          src={story.image}
                          alt={story.title}
                          className="atelier-story-bubble-thumb"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop";
                          }}
                        />
                      )}
                      <div className="atelier-story-bubble-overlay" />
                    </div>
                  </div>
                  <span className="atelier-story-bubble-title">{story.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <StoryViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        stories={displayStories}
        initialIndex={activeStoryIndex ?? 0}
      />
    </>
  );
}
