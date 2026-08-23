/**
 * ParallaxBackground.jsx — Dynamic Multi-Layer Parallax Background
 *
 * Renders floating ambient light spheres and subtle grid meshes that
 * respond smoothly to mouse movement (cursor parallax) and scrolling.
 * Uses direct DOM mutation (no React state) for zero-rerender perf.
 */

import React, { useEffect, useRef } from 'react';

export default function ParallaxBackground() {
  const orbPrimaryRef   = useRef(null);
  const orbSecondaryRef = useRef(null);
  const orbTertiaryRef  = useRef(null);
  const gridRef         = useRef(null);
  const rafRef          = useRef(null);

  useEffect(() => {
    // Raw target values (updated on events)
    let targetX = 0, targetY = 0, scrollY = 0;
    // Current lerped values
    let curX = 0, curY = 0;
    let running = true;

    const onMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onScroll = () => {
      scrollY = window.scrollY || 0;
    };

    const tick = () => {
      if (!running) return;
      // Lerp toward target — smooth but zero setState
      const LERP = 0.08;
      curX += (targetX - curX) * LERP;
      curY += (targetY - curY) * LERP;

      if (orbPrimaryRef.current) {
        orbPrimaryRef.current.style.transform =
          `translate3d(${curX * 20}px, ${curY * 20 - scrollY * 0.12}px, 0)`;
      }
      if (orbSecondaryRef.current) {
        orbSecondaryRef.current.style.transform =
          `translate3d(${curX * -28}px, ${curY * -28 - scrollY * 0.2}px, 0)`;
      }
      if (orbTertiaryRef.current) {
        orbTertiaryRef.current.style.transform =
          `translate3d(${curX * 36}px, ${curY * 36 - scrollY * 0.06}px, 0)`;
      }
      if (gridRef.current) {
        gridRef.current.style.transform =
          `perspective(1200px) rotateX(${curY * 2.5}deg) rotateY(${curX * -2.5}deg) translateY(${-scrollY * 0.04}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="parallax-viewport" aria-hidden="true">
      {/* Background Ambient Grid */}
      <div ref={gridRef} className="parallax-grid" />

      {/* Layer 1: Primary Glow Orb (Top Right) */}
      <div ref={orbPrimaryRef}   className="parallax-orb orb-primary" />

      {/* Layer 2: Secondary Glow Orb (Bottom Left) */}
      <div ref={orbSecondaryRef} className="parallax-orb orb-secondary" />

      {/* Layer 3: Accent Orb (Center) */}
      <div ref={orbTertiaryRef}  className="parallax-orb orb-tertiary" />

      {/* Vignette Overlay for Depth Focus */}
      <div className="parallax-vignette" />
    </div>
  );
}
