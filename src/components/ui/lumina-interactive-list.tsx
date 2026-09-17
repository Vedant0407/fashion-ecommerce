"use client";

import React, { useEffect, useRef } from "react";
import * as THREE_MODULE from "three";
import gsap_module from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";

declare const gsap: any;
declare const THREE: any;

export function Component() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCleanedUp = false;
    let animFrameId: number | null = null;
    let autoSlideTimer: any = null;
    let progressAnimation: any = null;
    let cleanupFn: (() => void) | null = null;

    // Ensure THREE and gsap are available globally from npm packages or CDN
    if (typeof window !== "undefined") {
      if (!(window as any).THREE) (window as any).THREE = THREE_MODULE;
      if (!(window as any).gsap) (window as any).gsap = gsap_module;
    }

    // --- DYNAMIC SCRIPT LOADING FALLBACK ---
    const loadScripts = async () => {
      const loadScript = (src: string, globalName: string) =>
        new Promise<void>((res, rej) => {
          if ((window as any)[globalName]) {
            res();
            return;
          }
          if (document.querySelector(`script[src="${src}"]`)) {
            const check = setInterval(() => {
              if ((window as any)[globalName]) {
                clearInterval(check);
                res();
              }
            }, 50);
            setTimeout(() => {
              clearInterval(check);
              rej(new Error(`Timeout waiting for ${globalName}`));
            }, 10000);
            return;
          }
          const s = document.createElement("script");
          s.src = src;
          s.crossOrigin = "anonymous";
          s.onload = () => {
            setTimeout(() => res(), 100);
          };
          s.onerror = () => rej(new Error(`Failed to load ${src}`));
          document.head.appendChild(s);
        });

      try {
        if (!(window as any).gsap) {
          await loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
            "gsap"
          );
        }
        if (!(window as any).THREE) {
          await loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
            "THREE"
          );
        }
      } catch (e) {
        console.warn("Script fallback notice:", e);
      }

      if (!isCleanedUp) {
        initApplication();
      }
    };

    const initApplication = async () => {
      const gsap = (window as any).gsap || gsap_module;
      const THREE = (window as any).THREE || THREE_MODULE;

      // --- MAIN CONFIG ---
      const SLIDER_CONFIG: any = {
        settings: {
          transitionDuration: 1.3,
          autoSlideSpeed: 5500,
          currentEffect: "glass",
          currentEffectPreset: "Default",
          globalIntensity: 1.0,
          speedMultiplier: 1.0,
          distortionStrength: 1.0,
          colorEnhancement: 1.0,
          glassRefractionStrength: 1.0,
          glassChromaticAberration: 1.0,
          glassBubbleClarity: 1.0,
          glassEdgeGlow: 1.0,
          glassLiquidFlow: 1.0,
          frostIntensity: 1.5,
          frostCrystalSize: 1.0,
          frostIceCoverage: 1.0,
          frostTemperature: 1.0,
          frostTexture: 1.0,
          rippleFrequency: 25.0,
          rippleAmplitude: 0.08,
          rippleWaveSpeed: 1.0,
          rippleRippleCount: 1.0,
          rippleDecay: 1.0,
          plasmaIntensity: 1.2,
          plasmaSpeed: 0.8,
          plasmaEnergyIntensity: 0.4,
          plasmaContrastBoost: 0.3,
          plasmaTurbulence: 1.0,
          timeshiftDistortion: 1.6,
          timeshiftBlur: 1.5,
          timeshiftFlow: 1.4,
          timeshiftChromatic: 1.5,
          timeshiftTurbulence: 1.4,
        },
      };

      // --- GLOBAL STATE ---
      let currentSlideIndex = 0;
      let isTransitioning = false;
      let shaderMaterial: any, renderer: any, scene: any, camera: any;
      let slideTextures: any[] = [];
      let texturesLoaded = false;
      let sliderEnabled = false;

      const SLIDE_DURATION = () => SLIDER_CONFIG.settings.autoSlideSpeed;
      const PROGRESS_UPDATE_INTERVAL = 50;
      const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;

      // Curated high-resolution Unsplash editorial fashion imagery with full CORS support
      const slides = [
        {
          title: "Ethereal Glow",
          description:
            "A soft, radiant light that illuminates the architectural drape and pure silken texture.",
          media:
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=85",
        },
        {
          title: "Rose Mirage",
          description:
            "Lost in an endless desert of tailored forms, sharp collars, and structural quiet luxury.",
          media:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=85",
        },
        {
          title: "Velvet Mystique",
          description:
            "Wrapped in the deep, architectural embrace of heavyweight combed jersey.",
          media:
            "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85",
        },
        {
          title: "Golden Hour",
          description:
            "That fleeting warm dusk when sculptural cotton poplin catches ambient evening light.",
          media:
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85",
        },
        {
          title: "Midnight Dreams",
          description:
            "Where understated silhouettes fade and pure tactile craftsmanship takes flight.",
          media:
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=85",
        },
        {
          title: "Silver Light",
          description:
            "A cool, metallic editorial sheen reflecting the quiet modern atelier pulse.",
          media:
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1800&q=85",
        },
      ];

      // --- SHADERS ---
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform sampler2D uTexture1, uTexture2;
        uniform float uProgress;
        uniform vec2 uResolution, uTexture1Size, uTexture2Size;
        uniform int uEffectType;
        uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength, uColorEnhancement;
        uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
        uniform float uFrostIntensity, uFrostCrystalSize, uFrostIceCoverage, uFrostTemperature, uFrostTexture;
        uniform float uRippleFrequency, uRippleAmplitude, uRippleWaveSpeed, uRippleRippleCount, uRippleDecay;
        uniform float uPlasmaIntensity, uPlasmaSpeed, uPlasmaEnergyIntensity, uPlasmaContrastBoost, uPlasmaTurbulence;
        uniform float uTimeshiftDistortion, uTimeshiftBlur, uTimeshiftFlow, uTimeshiftChromatic, uTimeshiftTurbulence;
        varying vec2 vUv;

        vec2 getCoverUV(vec2 uv, vec2 textureSize) {
            vec2 s = uResolution / textureSize;
            float scale = max(s.x, s.y);
            vec2 scaledSize = textureSize * scale;
            vec2 offset = (uResolution - scaledSize) * 0.5;
            return (uv * uResolution - offset) / scaledSize;
        }

        vec4 glassEffect(vec2 uv, float progress) {
            float time = progress * 5.0 * uSpeedMultiplier;
            vec2 uv1 = getCoverUV(uv, uTexture1Size);
            vec2 uv2 = getCoverUV(uv, uTexture2Size);
            float maxR = length(uResolution) * 0.85;
            float br = progress * maxR;
            vec2 p = uv * uResolution;
            vec2 c = uResolution * 0.5;
            float d = length(p - c);
            float nd = d / max(br, 0.001);
            float param = smoothstep(br + 3.0, br - 3.0, d);
            vec4 img;
            if (param > 0.0) {
                 float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
                 vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
                 vec2 distUV = uv2 - dir * ro;
                 distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
                 float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
                 img = vec4(
                    texture2D(uTexture2, distUV + dir * ca * 1.2).r,
                    texture2D(uTexture2, distUV + dir * ca * 0.2).g,
                    texture2D(uTexture2, distUV - dir * ca * 0.8).b,
                    1.0
                 );
                 if (uGlassEdgeGlow > 0.0) {
                    float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
                    img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
                 }
            } else {
                 img = texture2D(uTexture2, uv2);
            }
            vec4 oldImg = texture2D(uTexture1, uv1);
            if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
            return mix(oldImg, img, param);
        }

        vec4 frostEffect(vec2 uv, float progress) {
            return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress);
        }

        vec4 rippleEffect(vec2 uv, float progress) {
            return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress);
        }

        vec4 plasmaEffect(vec2 uv, float progress) {
            return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress);
        }

        vec4 timeshiftEffect(vec2 uv, float progress) {
            return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress);
        }

        void main() {
            if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
            else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
            else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
            else if (uEffectType == 3) gl_FragColor = plasmaEffect(vUv, uProgress);
            else gl_FragColor = timeshiftEffect(vUv, uProgress);
        }
      `;

      const getEffectIndex = (n: string) =>
        ({ glass: 0, frost: 1, ripple: 2, plasma: 3, timeshift: 4 } as any)[n] || 0;

      const updateShaderUniforms = () => {
        if (!shaderMaterial) return;
        const s = SLIDER_CONFIG.settings;
        const u = shaderMaterial.uniforms;
        for (const key in s) {
          const uName = "u" + key.charAt(0).toUpperCase() + key.slice(1);
          if (u[uName]) u[uName].value = s[key];
        }
        u.uEffectType.value = getEffectIndex(s.currentEffect);
      };

      const splitText = (text: string) => {
        return text
          .split("")
          .map(
            (char) =>
              `<span style="display: inline-block; opacity: 0;">${
                char === " " ? "&nbsp;" : char
              }</span>`
          )
          .join("");
      };

      let activeTween: any = null;
      let textTimeoutId: any = null;

      const updateContent = (idx: number, isFast = false) => {
        const titleEl = containerRef.current?.querySelector("#mainTitle") as HTMLElement;
        const descEl = containerRef.current?.querySelector("#mainDesc") as HTMLElement;
        if (!titleEl || !descEl) return;

        if (textTimeoutId) {
          clearTimeout(textTimeoutId);
          textTimeoutId = null;
        }

        gsap.killTweensOf(titleEl.children);
        gsap.killTweensOf(descEl);

        const outDuration = isFast ? 0.2 : 0.4;
        const inDelay = isFast ? 200 : 380;

        gsap.to(titleEl.children, {
          y: -15,
          opacity: 0,
          duration: outDuration,
          stagger: isFast ? 0.015 : 0.02,
          ease: "power2.in",
        });
        gsap.to(descEl, { y: -8, opacity: 0, duration: outDuration, ease: "power2.in" });

        textTimeoutId = setTimeout(() => {
          if (isCleanedUp) return;
          titleEl.innerHTML = splitText(slides[idx].title);
          descEl.textContent = slides[idx].description;

          gsap.set(titleEl.children, { opacity: 0 });
          gsap.set(descEl, { y: 15, opacity: 0 });

          const children = titleEl.children;
          const animDuration = isFast ? 0.7 : 0.8;
          const staggerDuration = isFast ? 0.02 : 0.03;
          const descDelay = isFast ? 0.12 : 0.2;

          switch (idx % 6) {
            case 0:
              gsap.set(children, { y: 15 });
              gsap.to(children, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                stagger: staggerDuration,
                ease: "power3.out",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power3.out",
              });
              break;
            case 1:
              gsap.set(children, { y: -15 });
              gsap.to(children, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                stagger: staggerDuration,
                ease: "back.out(1.5)",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power3.out",
              });
              break;
            case 2:
              gsap.set(children, { filter: "blur(6px)", scale: 1.2, y: 0 });
              gsap.to(children, {
                filter: "blur(0px)",
                scale: 1,
                opacity: 1,
                duration: isFast ? 0.45 : 0.9,
                stagger: { amount: isFast ? 0.2 : 0.4, from: "random" },
                ease: "power2.out",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power2.out",
              });
              break;
            case 3:
              gsap.set(children, { scale: 0.2, y: 0 });
              gsap.to(children, {
                scale: 1,
                opacity: 1,
                duration: animDuration,
                stagger: staggerDuration,
                ease: "back.out(1.4)",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power3.out",
              });
              break;
            case 4:
              gsap.set(children, {
                rotationX: 90,
                y: 0,
                transformOrigin: "50% 50%",
              });
              gsap.to(children, {
                rotationX: 0,
                opacity: 1,
                duration: animDuration,
                stagger: staggerDuration,
                ease: "power2.out",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power2.out",
              });
              break;
            case 5:
              gsap.set(children, { x: 20, y: 0 });
              gsap.to(children, {
                x: 0,
                opacity: 1,
                duration: animDuration,
                stagger: staggerDuration,
                ease: "power3.out",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power3.out",
              });
              break;
            default:
              gsap.set(children, { y: 15 });
              gsap.to(children, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                stagger: staggerDuration,
                ease: "power3.out",
              });
              gsap.to(descEl, {
                y: 0,
                opacity: 1,
                duration: animDuration,
                delay: descDelay,
                ease: "power3.out",
              });
          }
        }, inDelay);
      };

      const navigateToSlide = (targetIndex: number, isFast = false) => {
        if (targetIndex === currentSlideIndex || isCleanedUp) return;
        if (!texturesLoaded || !sliderEnabled || !shaderMaterial) return;

        stopAutoSlideTimer();
        quickResetProgress(currentSlideIndex);

        // Cancel running transition so rapid clicks advance immediately without locking
        if (activeTween) {
          activeTween.kill();
          activeTween = null;
        }

        const currentTexture = slideTextures[currentSlideIndex];
        const targetTexture = slideTextures[targetIndex];
        if (!currentTexture || !targetTexture) return;

        isTransitioning = true;
        shaderMaterial.uniforms.uProgress.value = 0;
        shaderMaterial.uniforms.uTexture1.value = currentTexture;
        shaderMaterial.uniforms.uTexture2.value = targetTexture;
        shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
        shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;

        updateContent(targetIndex, isFast);

        currentSlideIndex = targetIndex;
        updateCounter(currentSlideIndex);
        updateNavigationState(currentSlideIndex);

        // Smooth balanced transition (1.05s for manual clicks, 1.4s for auto-slide)
        // allows the liquid glass opening bubble reveal animation to be clearly visible and enjoyed
        const duration = isFast ? 1.05 : 1.4;

        activeTween = gsap.fromTo(
          shaderMaterial.uniforms.uProgress,
          { value: 0 },
          {
            value: 1,
            duration,
            ease: "power2.inOut",
            onComplete: () => {
              if (isCleanedUp) return;
              shaderMaterial.uniforms.uProgress.value = 0;
              shaderMaterial.uniforms.uTexture1.value = targetTexture;
              shaderMaterial.uniforms.uTexture1Size.value = targetTexture.userData.size;
              isTransitioning = false;
              activeTween = null;
              safeStartTimer(isFast ? 4500 : 100);
            },
          }
        );
      };

      const handlePrev = (e?: Event) => {
        e?.stopPropagation();
        e?.preventDefault();
        if (isCleanedUp || !texturesLoaded || !sliderEnabled) return;
        const target = (currentSlideIndex - 1 + slides.length) % slides.length;
        navigateToSlide(target, true);
      };

      const handleNext = (e?: Event) => {
        e?.stopPropagation();
        e?.preventDefault();
        if (isCleanedUp || !texturesLoaded || !sliderEnabled) return;
        const target = (currentSlideIndex + 1) % slides.length;
        navigateToSlide(target, true);
      };

      const handleSlideChange = () => {
        if (!texturesLoaded || !sliderEnabled || isCleanedUp) return;
        navigateToSlide((currentSlideIndex + 1) % slides.length, false);
      };

      const createSlidesNavigation = () => {
        const nav = containerRef.current?.querySelector("#slidesNav");
        if (!nav) return;
        nav.innerHTML = "";
        slides.forEach((slide, i) => {
          const item = document.createElement("div");
          item.className = `slide-nav-item${i === 0 ? " active" : ""}`;
          item.dataset.slideIndex = String(i);
          item.innerHTML = `<div class="slide-progress-line"><div class="slide-progress-fill"></div></div><div class="slide-nav-title">${slide.title}</div>`;
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            if (i !== currentSlideIndex) {
              stopAutoSlideTimer();
              quickResetProgress(currentSlideIndex);
              navigateToSlide(i, true);
            }
          });
          nav.appendChild(item);
        });
      };

      const updateNavigationState = (idx: number) => {
        containerRef.current
          ?.querySelectorAll(".slide-nav-item")
          .forEach((el, i) => el.classList.toggle("active", i === idx));
      };

      const updateSlideProgress = (idx: number, prog: number) => {
        const el = containerRef.current
          ?.querySelectorAll(".slide-nav-item")
          [idx]?.querySelector(".slide-progress-fill") as HTMLElement;
        if (el) {
          el.style.width = `${prog}%`;
          el.style.opacity = "1";
        }
      };

      const fadeSlideProgress = (idx: number) => {
        const el = containerRef.current
          ?.querySelectorAll(".slide-nav-item")
          [idx]?.querySelector(".slide-progress-fill") as HTMLElement;
        if (el) {
          el.style.opacity = "0";
          setTimeout(() => {
            if (el) el.style.width = "0%";
          }, 300);
        }
      };

      const quickResetProgress = (idx: number) => {
        const el = containerRef.current
          ?.querySelectorAll(".slide-nav-item")
          [idx]?.querySelector(".slide-progress-fill") as HTMLElement;
        if (el) {
          el.style.transition = "width 0.2s ease-out";
          el.style.width = "0%";
          setTimeout(() => {
            if (el) el.style.transition = "width 0.1s ease, opacity 0.3s ease";
          }, 200);
        }
      };

      const updateCounter = (idx: number) => {
        const sn = containerRef.current?.querySelector("#slideNumber");
        if (sn) sn.textContent = String(idx + 1).padStart(2, "0");
        const st = containerRef.current?.querySelector("#slideTotal");
        if (st) st.textContent = String(slides.length).padStart(2, "0");
      };

      const startAutoSlideTimer = () => {
        if (!texturesLoaded || !sliderEnabled || isCleanedUp) return;
        stopAutoSlideTimer();
        let progress = 0;
        const increment = (100 / SLIDE_DURATION()) * PROGRESS_UPDATE_INTERVAL;
        progressAnimation = setInterval(() => {
          if (!sliderEnabled || isCleanedUp) {
            stopAutoSlideTimer();
            return;
          }
          progress += increment;
          updateSlideProgress(currentSlideIndex, progress);
          if (progress >= 100) {
            clearInterval(progressAnimation);
            progressAnimation = null;
            fadeSlideProgress(currentSlideIndex);
            if (!isTransitioning) handleSlideChange();
          }
        }, PROGRESS_UPDATE_INTERVAL);
      };

      const stopAutoSlideTimer = () => {
        if (progressAnimation) clearInterval(progressAnimation);
        if (autoSlideTimer) clearTimeout(autoSlideTimer);
        progressAnimation = null;
        autoSlideTimer = null;
      };

      const safeStartTimer = (delay = 0) => {
        stopAutoSlideTimer();
        if (sliderEnabled && texturesLoaded && !isCleanedUp) {
          if (delay > 0) autoSlideTimer = setTimeout(startAutoSlideTimer, delay);
          else startAutoSlideTimer();
        }
      };

      const loadImageTexture = (src: string) =>
        new Promise<any>((resolve) => {
          const l = new THREE.TextureLoader();
          l.setCrossOrigin("anonymous");
          l.load(
            src,
            (t: any) => {
              t.minFilter = t.magFilter = THREE.LinearFilter;
              t.userData = {
                size: new THREE.Vector2(
                  t.image ? t.image.width || 1920 : 1920,
                  t.image ? t.image.height || 1080 : 1080
                ),
              };
              resolve(t);
            },
            undefined,
            (err: any) => {
              console.warn("Notice: Failed to load texture:", src, err);
              // Fallback to 16x16 neutral texture to avoid breaking WebGL pipeline
              const canvas = document.createElement("canvas");
              canvas.width = 16;
              canvas.height = 16;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.fillStyle = "#181818";
                ctx.fillRect(0, 0, 16, 16);
              }
              const fallbackTex = new THREE.CanvasTexture(canvas);
              fallbackTex.userData = { size: new THREE.Vector2(16, 16) };
              resolve(fallbackTex);
            }
          );
        });

      const initRenderer = async () => {
        const canvas = containerRef.current?.querySelector(".webgl-canvas") as HTMLCanvasElement;
        if (!canvas || isCleanedUp) return;

        const width = containerRef.current?.clientWidth || window.innerWidth;
        const height = containerRef.current?.clientHeight || window.innerHeight;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTexture1: { value: null },
            uTexture2: { value: null },
            uProgress: { value: 0 },
            uResolution: { value: new THREE.Vector2(width, height) },
            uTexture1Size: { value: new THREE.Vector2(1, 1) },
            uTexture2Size: { value: new THREE.Vector2(1, 1) },
            uEffectType: { value: 0 },
            uGlobalIntensity: { value: 1.0 },
            uSpeedMultiplier: { value: 1.0 },
            uDistortionStrength: { value: 1.0 },
            uColorEnhancement: { value: 1.0 },
            uGlassRefractionStrength: { value: 1.0 },
            uGlassChromaticAberration: { value: 1.0 },
            uGlassBubbleClarity: { value: 1.0 },
            uGlassEdgeGlow: { value: 1.0 },
            uGlassLiquidFlow: { value: 1.0 },
            uFrostIntensity: { value: 1.0 },
            uFrostCrystalSize: { value: 1.0 },
            uFrostIceCoverage: { value: 1.0 },
            uFrostTemperature: { value: 1.0 },
            uFrostTexture: { value: 1.0 },
            uRippleFrequency: { value: 25.0 },
            uRippleAmplitude: { value: 0.08 },
            uRippleWaveSpeed: { value: 1.0 },
            uRippleRippleCount: { value: 1.0 },
            uRippleDecay: { value: 1.0 },
            uPlasmaIntensity: { value: 1.2 },
            uPlasmaSpeed: { value: 0.8 },
            uPlasmaEnergyIntensity: { value: 0.4 },
            uPlasmaContrastBoost: { value: 0.3 },
            uPlasmaTurbulence: { value: 1.0 },
            uTimeshiftDistortion: { value: 1.6 },
            uTimeshiftBlur: { value: 1.5 },
            uTimeshiftFlow: { value: 1.4 },
            uTimeshiftChromatic: { value: 1.5 },
            uTimeshiftTurbulence: { value: 1.4 },
          },
          vertexShader,
          fragmentShader,
        });

        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

        for (const s of slides) {
          try {
            slideTextures.push(await loadImageTexture(s.media));
          } catch {
            console.warn("Failed texture");
          }
        }

        if (isCleanedUp) return;

        if (slideTextures.length >= 2) {
          shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
          shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
          shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
          shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1].userData.size;
          texturesLoaded = true;
          sliderEnabled = true;
          updateShaderUniforms();
          containerRef.current?.classList.add("loaded");
          safeStartTimer(500);
        }

        const render = () => {
          if (isCleanedUp) return;
          animFrameId = requestAnimationFrame(render);
          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
        };
        render();
      };

      createSlidesNavigation();
      updateCounter(0);

      const tEl = containerRef.current?.querySelector("#mainTitle") as HTMLElement;
      const dEl = containerRef.current?.querySelector("#mainDesc") as HTMLElement;
      if (tEl && dEl) {
        tEl.innerHTML = splitText(slides[0].title);
        dEl.textContent = slides[0].description;
        gsap.fromTo(
          tEl.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.03, ease: "power3.out", delay: 0.5 }
        );
        gsap.fromTo(
          dEl,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 }
        );
      }

      await initRenderer();

      const handleVisibilityChange = () => {
        if (document.hidden) stopAutoSlideTimer();
        else if (!isTransitioning) safeStartTimer();
      };

      const handleResize = () => {
        if (renderer && shaderMaterial && containerRef.current) {
          const w = containerRef.current.clientWidth || window.innerWidth;
          const h = containerRef.current.clientHeight || window.innerHeight;
          renderer.setSize(w, h);
          shaderMaterial.uniforms.uResolution.value.set(w, h);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("resize", handleResize);

      const prevBtn = containerRef.current?.querySelector("#slidePrevBtn");
      const nextBtn = containerRef.current?.querySelector("#slideNextBtn");

      prevBtn?.addEventListener("click", handlePrev);
      nextBtn?.addEventListener("click", handleNext);

      const handleKeyDown = (e: KeyboardEvent) => {
        const activeEl = document.activeElement;
        const tag = activeEl?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || activeEl?.getAttribute("contenteditable") === "true") {
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      let touchStartX = 0;
      let touchStartY = 0;
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      };
      const handleTouchEnd = (e: TouchEvent) => {
        if (e.changedTouches.length === 1) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX > 0) {
              handlePrev();
            } else {
              handleNext();
            }
          }
        }
      };
      const wrapperEl = containerRef.current;
      wrapperEl?.addEventListener("touchstart", handleTouchStart, { passive: true });
      wrapperEl?.addEventListener("touchend", handleTouchEnd, { passive: true });

      cleanupFn = () => {
        prevBtn?.removeEventListener("click", handlePrev);
        nextBtn?.removeEventListener("click", handleNext);
        window.removeEventListener("keydown", handleKeyDown);
        wrapperEl?.removeEventListener("touchstart", handleTouchStart);
        wrapperEl?.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("resize", handleResize);
        if (activeTween) activeTween.kill();
        if (textTimeoutId) clearTimeout(textTimeoutId);
      };
    };

    loadScripts();

    return () => {
      isCleanedUp = true;
      if (cleanupFn) cleanupFn();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (autoSlideTimer) clearTimeout(autoSlideTimer);
      if (progressAnimation) clearInterval(progressAnimation);
    };
  }, []);

  return (
    <main className="slider-wrapper" ref={containerRef}>
      <canvas className="webgl-canvas"></canvas>

      <div className="slide-content">
        <h1 className="slide-title" id="mainTitle"></h1>
        <p className="slide-description" id="mainDesc"></p>
      </div>

      {/* Quick Image Navigation Arrow Controls */}
      <div className="slider-arrow-controls">
        <button
          type="button"
          className="slider-arrow-btn slider-arrow-prev"
          id="slidePrevBtn"
          aria-label="Previous image"
          title="Previous image (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="slider-arrow-btn slider-arrow-next"
          id="slideNextBtn"
          aria-label="Next image"
          title="Next image (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <nav className="slides-navigation" id="slidesNav"></nav>
    </main>
  );
}

export const LuminaInteractiveList = Component;
export default Component;
