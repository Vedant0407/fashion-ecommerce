"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";
import { ArrowDown, RotateCcw, Sparkles } from "lucide-react";

// 3D T-Shirt Model Component inside Canvas
function TshirtModel({ progress }: { progress: number }) {
  const { scene } = useGLTF("/greeno.tshirt.glb");
  const groupRef = useRef<THREE.Group>(null);

  // Clone scene so it is isolated and cleanly mounted
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smoothly scale and move upward as user scrolls
    // At progress 0: scale = 1.05, y = -0.2 (centered floating look)
    // At progress 1: scale = 2.65, y = 1.75 (collar reaches and touches the navbar)
    const targetScale = 1.05 + progress * 1.6;
    const targetY = -0.2 + progress * 1.95;

    // Smooth interpolation for jitter-free physics
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.14
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.14
    );

    // Auto-rotate around Y-axis when at top, slowing down as user zooms in
    if (progress < 0.8) {
      groupRef.current.rotation.y += delta * 0.75 * (1 - progress * 0.85);
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

// Fallback loader while 3D mesh loads
function CanvasFallback() {
  return (
    <div className="hero-3d-loading-state">
      <div className="hero-3d-spinner" />
      <span className="hero-3d-loading-text">LOADING 3D SILHOUETTE...</span>
    </div>
  );
}

export default function ThreeDHero() {
  const trackRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track native scroll through the 200vh track
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollProgress(latest);
  });

  const scrollToRunway = (e: React.MouseEvent) => {
    e.preventDefault();
    const runway = document.getElementById("runway-hero");
    if (runway) {
      runway.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      ref={trackRef}
      className="hero-3d-scroll-track"
      aria-label="GreenO 3D T-Shirt Hero"
    >
      {/* STICKY VIEWPORT: Stays locked at top while user scrolls & zooms t-shirt */}
      <div className="hero-3d-sticky-viewport">
        {/* Ambient Dark Luxury Background */}
        <div className="hero-3d-bg">
          <div className="hero-3d-glow" />
          <div className="hero-3d-vignette" />
        </div>

        {/* Top Navbar Touchpoint Guide Indicator */}
        <div
          className={`hero-3d-navbar-guide ${
            scrollProgress > 0.85 ? "touching" : ""
          }`}
        >
          <div className="hero-3d-guide-line" />
          <span className="hero-3d-guide-label">
            {scrollProgress > 0.88
              ? "APEX TOUCHED • TRANSITIONING TO RUNWAY"
              : "3D SILHOUETTE // SCROLL TO EXPAND"}
          </span>
        </div>

        {/* 3D Canvas Stage */}
        <div className="hero-3d-canvas-wrap">
          {mounted ? (
            <Canvas
              camera={{
                position: [0, 0, 8.8],
                fov: 34,
              }}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
              }}
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
              }}
            >
              {/* Studio Environment Lighting */}
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 8, 5]} intensity={1.6} />
              <directionalLight
                position={[-5, 4, -4]}
                intensity={1.2}
                color="#f5f0e8"
              />
              <directionalLight position={[0, -2, 4]} intensity={0.5} />
              <Environment preset="studio" />

              <Suspense fallback={null}>
                <TshirtModel progress={scrollProgress} />
              </Suspense>

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                maxPolarAngle={Math.PI / 2 + 0.35}
                minPolarAngle={Math.PI / 2 - 0.35}
              />
            </Canvas>
          ) : (
            <CanvasFallback />
          )}
        </div>

        {/* Minimal Scroll Prompt at Bottom (fades out as user zooms) */}
        <motion.div
          className="hero-3d-bottom-prompt"
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 2.2),
            pointerEvents: scrollProgress > 0.4 ? "none" : "auto",
          }}
        >
          <a
            href="#runway-hero"
            onClick={scrollToRunway}
            className="hero-3d-scroll-btn"
            aria-label="Scroll down to runway showcase"
          >
            <span className="hero-3d-scroll-label">SCROLL TO ZOOM</span>
            <ArrowDown
              size={13}
              strokeWidth={2}
              className="hero-3d-scroll-arrow"
            />
          </a>
        </motion.div>

        {/* Touchpoint Status Pill (appears when reaching near apex) */}
        {scrollProgress > 0.7 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-3d-touch-pill"
          >
            <Sparkles size={11} strokeWidth={2} />
            <span>
              {scrollProgress > 0.92
                ? "APEX REACHED // ENTERING RUNWAY SHOWCASE"
                : "EXPANDING TO NAVBAR APEX..."}
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Preload the 3D GLB model
useGLTF.preload("/greeno.tshirt.glb");
