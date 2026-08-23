/**
 * VoiceOrbShader.jsx — Interactive Fluid Orb Shader
 *
 * Renders the glowing blue-violet circular orb with fluid light wave
 * animation (matching the visual reference) using WebGL with smooth fallback.
 */

import React, { useEffect, useRef } from 'react';

export default function VoiceOrbShader({ isListening, isProcessing, size = 96 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId;
    let glCleanup = null;

    // Defer WebGL initialization until visible
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || glCleanup) return;
        io.disconnect();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform float u_listening;
      uniform float u_processing;

      void main() {
        vec2 uv = v_uv - 0.5;
        float dist = length(uv);

        // Circular boundary mask with smooth edge
        float circleMask = 1.0 - smoothstep(0.46, 0.495, dist);
        if (circleMask <= 0.0) {
          gl_FragColor = vec4(0.0);
          return;
        }

        // Fluid wave dynamics
        float speed = (u_listening > 0.5) ? 3.5 : (u_processing > 0.5 ? 4.5 : 1.2);
        float wave1 = sin(uv.x * 6.0 + u_time * speed) * 0.08;
        float wave2 = cos(uv.x * 10.0 - u_time * (speed * 0.8)) * 0.04;
        float wave3 = sin(uv.x * 14.0 + u_time * (speed * 1.2)) * 0.02;
        float waveCombined = wave1 + wave2 + wave3;

        // Wave horizontal band offset
        float waveDist = abs((uv.y - 0.04) + waveCombined);

        // Gradient color palette matching purple haze aesthetic:
        // Top: Radiant Electric Violet (#7C3AED)
        // Middle Wave: Glowing White/Ice (#FFFFFF)
        // Bottom: Soft Lilac/Magenta (#D946EF)
        vec3 colTop    = vec3(0.48, 0.23, 0.95);
        vec3 colMiddle = vec3(0.98, 0.95, 1.0);
        vec3 colBottom = vec3(0.85, 0.45, 0.98);

        // Vertical blend
        float t = uv.y + 0.5;
        vec3 baseGradient = mix(colBottom, colTop, smoothstep(0.1, 0.9, t));

        // Core glowing light wave across center
        float waveGlow = exp(-waveDist * 8.0) * 0.9;
        float softGlow = exp(-waveDist * 3.5) * 0.4;

        vec3 finalColor = mix(baseGradient, colMiddle, waveGlow + softGlow);

        // Subtle ambient edge lighting
        float rim = smoothstep(0.35, 0.49, dist) * 0.15;
        finalColor += vec3(0.8, 0.9, 1.0) * rim;

        // Pulse intensity when actively listening
        if (u_listening > 0.5) {
          float pulse = 0.5 + 0.5 * sin(u_time * 6.0);
          finalColor += vec3(0.15, 0.25, 0.4) * pulse;
        }

        gl_FragColor = vec4(finalColor, circleMask);
      }
    `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    // Quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc       = gl.getUniformLocation(program, 'u_time');
    const uListeningLoc  = gl.getUniformLocation(program, 'u_listening');
    const uProcessingLoc = gl.getUniformLocation(program, 'u_processing');

    const startTime = performance.now();

    const render = (time) => {
      const elapsed = (time - startTime) * 0.001;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsed);
      if (uListeningLoc) gl.uniform1f(uListeningLoc, isListening ? 1.0 : 0.0);
      if (uProcessingLoc) gl.uniform1f(uProcessingLoc, isProcessing ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    glCleanup = () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
      },
      { rootMargin: '100px' }
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      if (glCleanup) glCleanup();
    };
  }, [isListening, isProcessing]);

  return (
    <div
      className={`voice-orb-wrapper${isListening ? ' active-listening' : ''}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer ambient glow halo */}
      <div
        className="voice-orb-glow"
        style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120, 150, 255, 0.45) 0%, rgba(90, 120, 255, 0.15) 50%, transparent 70%)',
          filter: 'blur(10px)',
          opacity: isListening ? 0.9 : 0.45,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          transform: isListening ? 'scale(1.2)' : 'scale(1)',
          pointerEvents: 'none',
        }}
      />

      {/* WebGL Animated Shader Canvas */}
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'block',
          cursor: 'pointer',
          background: 'radial-gradient(circle, rgba(122,58,237,0.7) 0%, rgba(217,70,239,0.5) 60%, rgba(139,92,246,0.3) 100%)',
        }}
      />
    </div>
  );
}
