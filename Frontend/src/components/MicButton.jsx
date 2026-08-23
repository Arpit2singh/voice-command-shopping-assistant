/**
 * MicButton.jsx — ListEase Voice Control Button with Fluid Orb Shader
 *
 * Integrates the glowing fluid wave orb animation (matching the reference image)
 * with speech recognition trigger and bilingual language toggle.
 */

import React from 'react';
import { Keyboard, Mic } from 'lucide-react';
import VoiceOrbShader from './VoiceOrbShader';

export default function MicButton({
  isListening,
  isProcessing,
  isSupported,
  onStart,
  onStop,
  lang = 'en-IN',
  onLangChange,
}) {
  const handleClick = () => {
    if (!isSupported) return;
    if (isListening) onStop();
    else onStart();
  };

  const getStatusText = () => {
    if (isProcessing) return 'Understanding...';
    if (!isSupported) return 'Text Mode (Mic Unsupported)';
    if (isListening) return 'Listening... Tap to stop';
    return 'Tap to Speak';
  };

  return (
    <div className="voice-widget">
      <div className="mic-button-container" style={{ width: 104, height: 104 }}>
        {/* Glowing Fluid Orb Shader Canvas */}
        <div
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
          style={{ cursor: 'pointer', position: 'relative' }}
          title={isListening ? 'Stop listening' : 'Start speaking'}
          aria-label={isListening ? 'Stop recording voice command' : 'Start voice command'}
        >
          <VoiceOrbShader
            isListening={isListening}
            isProcessing={isProcessing}
            size={100}
          />

          {/* Center Icon Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {isProcessing ? (
              <span
                className="spinner"
                style={{ width: 26, height: 26, borderWidth: 2.5, borderTopColor: '#ffffff' }}
              />
            ) : !isSupported ? (
              <Keyboard
                size={30}
                color="#ffffff"
                style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}
              />
            ) : (
              <Mic
                size={34}
                color={isListening ? '#ffffff' : 'rgba(255, 255, 255, 0.92)'}
                style={{
                  filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.4))',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isListening ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            )}
          </div>
        </div>
      </div>

      <span className={`mic-status-label${isListening ? ' listening' : ''}`}>
        {getStatusText()}
      </span>

      {/* Language Switcher */}
      {isSupported && onLangChange && (
        <div className="lang-switcher" role="group" aria-label="Select voice language">
          <button
            type="button"
            className={`lang-btn${lang === 'en-IN' ? ' active' : ''}`}
            onClick={() => onLangChange('en-IN')}
          >
            EN
          </button>
          <button
            type="button"
            className={`lang-btn${lang === 'hi-IN' ? ' active' : ''}`}
            onClick={() => onLangChange('hi-IN')}
          >
            हिन्दी
          </button>
        </div>
      )}
    </div>
  );
}
