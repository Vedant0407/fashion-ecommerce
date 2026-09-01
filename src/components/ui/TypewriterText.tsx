"use client";

import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
}

export default function TypewriterText({
  text,
  className = "",
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const element = document.getElementById(
      `typewriter-${text.replace(/\s/g, "-")}`
    );

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    if (!started) return;

    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span
      id={`typewriter-${text.replace(/\s/g, "-")}`}
      className={className}
    >
      {displayText}
    </span>
  );
}