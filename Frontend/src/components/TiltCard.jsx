/**
 * TiltCard.jsx — 3D Parallax Tilt & Specular Sheen Wrapper
 *
 * Adds subtle physics-based 3D tilt and dynamic light reflection
 * tracking the user's cursor position.
 * Uses direct DOM mutation (no React state) for zero-rerender perf.
 */

import React, { useRef, useCallback } from 'react';

export default function TiltCard({
  children,
  className = '',
  maxTilt = 8,
  glare = true,
  style = {},
  onClick,
  ...props
}) {
  const cardRef  = useRef(null);
  const glareRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotX = ((y / rect.height) - 0.5) * -maxTilt;
    const rotY = ((x / rect.width)  - 0.5) *  maxTilt;

    cardRef.current.style.transform =
      `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`;
    cardRef.current.style.transition = 'transform 80ms ease-out';

    if (glare && glareRef.current) {
      const gx = (x / rect.width)  * 100;
      const gy = (y / rect.height) * 100;
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background =
        `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
    }
  }, [maxTilt, glare]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    cardRef.current.style.transition = 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  }, [glare]);

  return (
    <div
      ref={cardRef}
      className={`tilt-card-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)',
        transition: 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        ...style,
      }}
      {...props}
    >
      {children}

      {/* Dynamic specular glare overlay — always in DOM, toggled via opacity */}
      {glare && (
        <div
          ref={glareRef}
          className="tilt-glare"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

