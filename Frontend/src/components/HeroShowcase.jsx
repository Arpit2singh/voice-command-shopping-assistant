/**
 * HeroShowcase.jsx — ListEase Hero Showcase (Dark Theme)
 *
 * Implements the 2-column showcase layout:
 *  - Left: Headline "Shop Smarter, Hands-Free.", voice CTA buttons, value props
 *  - Right: 2x2 interactive voice scenarios with speech bubbles and waveform animations.
 *    Clicking any scenario chip directly tests & executes the voice command!
 */

import React from 'react';
import { Mic } from 'lucide-react';
import GradientWaves from './GradientWaves';
import AccordionGallery from './AccordionGallery';
import SplitFlapText from './SplitFlapText';

const GALLERY_ITEMS = [
  {
    image: '/apples.png',
    label: 'Organic Apples',
    command: 'add 2 kg apples',
    alt: 'Fresh organic apples'
  },
  {
    image: '/milk.png',
    label: 'Fresh Farm Milk',
    command: 'doodh add karo',
    alt: 'Pure dairy milk'
  },
  {
    image: '/tomatoes.png',
    label: 'Juicy Tomatoes',
    command: 'add 1 kg tomatoes',
    alt: 'Fresh farm tomatoes'
  },
  {
    image: '/water.jpg',
    label: 'Sparkling Water',
    command: 'add 2 bottles of water',
    alt: 'Fresh sparkling water bottles'
  }
];

export default function HeroShowcase({
  onStartVoice,
  onExecuteDemoCommand,
  isListening,
}) {
  return (
    <section className="hero-showcase-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ── Full-bleed WebGL Wave Background ─────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GradientWaves
          horizonColor="#5227FF"
          waveColor="#FF9FFC"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1}
          opacity={1}
          mouseInteraction
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
        />
      </div>

      {/* ── Gradient overlay so text stays readable ─────────── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(11,7,22,0.65) 0%, rgba(11,7,22,0.2) 50%, rgba(11,7,22,0.85) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Hero content (above WebGL layer) ─────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'contents' }}>

      <div className="hero-left-content">
        {/* SplitFlap hero tag — cycles shopping voice commands */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(11, 7, 22, 0.55)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '14px',
          padding: '10px 16px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          width: 'fit-content',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#a855f7',
            boxShadow: '0 0 8px #a855f7',
            flexShrink: 0,
            animation: 'mic-pulse 2s ease-in-out infinite'
          }} />
          <SplitFlapText
            words={['VOICE FIRST', 'SHOP SMARTER', 'HANDS  FREE', 'ALWAYS ON']}
            flipDuration={0.1}
            stagger={0.055}
            cycleDelay={2200}
            charset="alpha"
            flipsPerChar={6}
            tileColor="#1a1035"
            textColor="#c4b5fd"
            tileRadius={6}
            gap={4}
            fontSize={15}
            padTo={11}
            loop
          />
        </div>

        {/* Main Display Headline */}
        <h1 className="hero-headline">
          Shop Smarter,<br />
          <span className="hero-highlight">Hands-Free.</span>
        </h1>

        {/* Subtitle description */}
        <p className="hero-description">
          Use your voice to manage your grocery list, get smart recommendations,
          filter catalog items, and never forget what you need.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta-group">
          <button
            type="button"
            className={`hero-primary-cta${isListening ? ' listening' : ''}`}
            onClick={onStartVoice}
          >
            <Mic size={20} />
            <span>{isListening ? 'Listening Now...' : 'Start Voice Command'}</span>
          </button>

          <button
            type="button"
            className="hero-secondary-cta"
            onClick={() => onExecuteDemoCommand?.('add 2 kg apples')}
          >
            Try Demo
          </button>
        </div>

        {/* Feature Value Props Row */}
        <div className="hero-feature-tags">
          <div className="feature-tag-item">
            <span className="feature-dot" />
            <span>Voice Commands</span>
          </div>
          <div className="feature-tag-item">
            <span className="feature-dot" />
            <span>Smart Suggestions</span>
          </div>
          <div className="feature-tag-item">
            <span className="feature-dot" />
            <span>Multi-language</span>
          </div>
          <div className="feature-tag-item">
            <span className="feature-dot" />
            <span>Always Accessible</span>
          </div>
        </div>
      </div>

      {/* ── Right Column: 3D GSAP Accordion Gallery ───────────── */}
      <div className="hero-right-grid" style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', minHeight: 400, width: '100%' }}>
        <AccordionGallery
          items={GALLERY_ITEMS}
          defaultIndex={1}
          accentColor="#a855f7"
          overlayColor="#0b0716"
          textColor="#ffffff"
          height={400}
          gap={12}
          radius={18}
          expandRatio={0.52}
          duration={0.65}
          ease="power3.out"
          tilt={6}
          parallax={0.4}
          grayscale={true}
          onItemClick={(item) => onExecuteDemoCommand?.(item.command)}
        />
      </div>
      </div>
    </section>
  );
}
