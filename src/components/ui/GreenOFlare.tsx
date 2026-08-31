"use client";

import { motion } from "framer-motion";

export default function GreenOFlare() {
  return (
    <div className="greeno-rendering">

      <motion.div
        className="greeno-soft-glow"
        animate={{
          opacity: [0.45, 0.75, 0.45],
          scale: [0.96, 1.03, 0.96],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="greeno-center-flash"
        animate={{
          opacity: [0.15, 0.45, 0.15],
          scale: [0.9, 1.08, 0.9],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

    </div>
  );
}