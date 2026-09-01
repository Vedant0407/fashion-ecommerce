"use client";

import { useEffect, useRef } from "react";

export default function SpotlightCursor() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spotlight = spotlightRef.current;

    if (!spotlight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = spotlight.parentElement?.getBoundingClientRect();

      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      spotlight.style.left = `${x}px`;
      spotlight.style.top = `${y}px`;
      spotlight.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      spotlight.style.opacity = "0";
    };

    const parent = spotlight.parentElement;

    if (!parent) return;

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <div ref={spotlightRef} className="hero-spotlight" />;
}