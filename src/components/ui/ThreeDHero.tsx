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

  // Track turn choreography state
  const isTurnActiveRef = useRef(false);
  const startTurnAngleRef = useRef(0);
  const targetBackAngleRef = useRef(Math.PI);

  // Clone scene with enhanced high-fashion fabric material
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.roughness = 0.85;
          mat.metalness = 0.06;
          mat.needsUpdate = true;
          mesh.material = mat;
        }
      }
    });
    return cloned;
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 1. CINEMATIC SLOW-INCREASING SCALE IN THE EXACT CENTER OF THE PAGE
    // Zooms outward symmetrically in the middle of the screen (no upward drift)
    const slowEase = Math.pow(progress, 1.45);
    const targetScale = 0.70 + slowEase * 1.55; // reaches ~2.25 at progress 1.0

    // Strictly centered vertically at Y = 0 (subtle organic breathing float only when idle at top)
    const targetY =
      progress < 0.01
        ? Math.sin(state.clock.elapsedTime * 1.2) * 0.03
        : 0;

    // Heavy, weighted Steadicam lerp interpolation (delta-corrected)
    const lerpRate = 1 - Math.exp(-7 * delta);
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      lerpRate
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      lerpRate
    );
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      0,
      lerpRate
    );

    // 2. REVOLUTION SPEED & BACK DESIGN TURN CHOREOGRAPHY
    if (progress < 0.01) {
      // Idle at top: slow, calm, majestic luxury revolution (0.15 rad/sec)
      isTurnActiveRef.current = false;
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0,
        lerpRate
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        0,
        lerpRate
      );
    } else {
      // User is scrolling: choreograph turn to finish on BACK DESIGN (odd multiple of Math.PI)
      if (!isTurnActiveRef.current) {
        isTurnActiveRef.current = true;
        const currentRot = groupRef.current.rotation.y;
        startTurnAngleRef.current = currentRot;

        // Find next odd multiple of PI ahead in the rotation direction
        const k = Math.floor(currentRot / (2 * Math.PI));
        let targetBack = (2 * k + 1) * Math.PI;
        // Ensure at least a deliberate, majestic sweep (minimum 100° forward turn)
        if (targetBack - currentRot < Math.PI * 0.55) {
          targetBack += 2 * Math.PI;
        }
        targetBackAngleRef.current = targetBack;
      }

      // Smooth turn progress curve
      const turnT = Math.pow(progress, 1.22);
      const targetRotY =
        startTurnAngleRef.current +
        (targetBackAngleRef.current - startTurnAngleRef.current) * turnT;

      // Subtle dynamic camera tilt/roll arc during mid-turn for high-production depth
      const tiltArc = Math.sin(progress * Math.PI);
      const targetRotX = tiltArc * 0.05;
      const targetRotZ = tiltArc * -0.025;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        lerpRate
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        lerpRate
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetRotZ,
        lerpRate
      );
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

  // Track native scroll through the extended cinematic track
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
              {/* Studio Environment & Dual-Tone Atmospheric Illumination (matching reference) */}
              <ambientLight intensity={0.7} color="#2b2d38" />

              {/* Soft Cool Studio Key Light from Front-Left */}
              <directionalLight
                position={[-5, 5, 5]}
                intensity={1.4}
                color="#e8ecf6"
              />

              {/* Iconic Crimson Studio Rim Light from Right/Rear (matching reference image) */}
              <directionalLight
                position={[6, 3, -3]}
                intensity={3.6}
                color="#ff3b30"
              />

              {/* Crimson Accent Fill from Mid-Right */}
              <directionalLight
                position={[4, -1, 2]}
                intensity={1.6}
                color="#e63946"
              />

              {/* Rear Subtle Atmospheric Backlight */}
              <directionalLight
                position={[0, 4, -7]}
                intensity={1.4}
                color="#f2dde2"
              />

              {/* Low Soft Upward Fill */}
              <directionalLight position={[0, -3, 3]} intensity={0.4} />
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

        {/* Minimal Scroll Prompt at Bottom (fades out as user scrolls past 0.35) */}
        <motion.div
          className="hero-3d-bottom-prompt"
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 2.8),
            pointerEvents: scrollProgress > 0.35 ? "none" : "auto",
          }}
        >
          <a
            href="#runway-hero"
            onClick={scrollToRunway}
            className="hero-3d-scroll-btn"
            aria-label="Scroll down to rotate and expand t-shirt"
          >
            <span className="hero-3d-scroll-label">SCROLL TO ROTATE & ZOOM</span>
            <ArrowDown
              size={13}
              strokeWidth={2}
              className="hero-3d-scroll-arrow"
            />
          </a>
        </motion.div>

        {/* Touchpoint Status Pill (appears when reaching near apex) */}
        {scrollProgress > 0.65 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-3d-touch-pill"
          >
            <Sparkles size={11} strokeWidth={2} />
            <span>
              {scrollProgress > 0.92
                ? "BACK DESIGN IN FOCUS // TRANSITIONING TO RUNWAY"
                : "TURNING TO BACK DESIGN..."}
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Preload the 3D GLB model
useGLTF.preload("/greeno.tshirt.glb");
