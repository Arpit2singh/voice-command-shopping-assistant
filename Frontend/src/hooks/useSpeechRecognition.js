/**
 * useSpeechRecognition.js — Web Speech API hook (Phase 2)
 *
 * Returns:
 *   isSupported        — false if browser lacks Web Speech API → show text-only fallback
 *   isListening        — true while mic is active
 *   transcript         — final transcript string
 *   interimTranscript  — live partial result shown to user while speaking
 *   error              — error code string ('not-allowed' | 'no-speech' | etc.) or null
 *   startListening()   — begin capture
 *   stopListening()    — abort capture
 *   reset()            — clear transcript + error
 *
 * Edge cases handled (Phase 2):
 *   - 'not-allowed' → error set, persistent banner shown
 *   - 'no-speech'   → error set, toast shown, not persistent
 *   - Unsupported browser → isSupported = false immediately on mount
 *   - interimResults:true → user sees live text to decide if they want to retry
 *   - Recognition auto-stops on silence (continuous:false)
 *   - Cleanup on unmount prevents state updates on dead components
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function useSpeechRecognition(lang = 'en-IN') {
  const [isListening, setIsListening]               = useState(false);
  const [transcript, setTranscript]                 = useState('');
  const [interimTranscript, setInterimTranscript]   = useState('');
  const [error, setError]                           = useState(null);
  const recognitionRef                              = useRef(null);
  const mountedRef                                  = useRef(true);

  const isSupported = Boolean(SpeechRecognition);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clean up on unmount
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang            = lang;
    recognition.continuous      = false;
    recognition.interimResults  = true;   // show live text while speaking
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (mountedRef.current) setIsListening(true);
    };

    recognition.onresult = (e) => {
      if (!mountedRef.current) return;

      let interim = '';
      let final   = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) setInterimTranscript(interim);
      if (final) {
        setTranscript(final.trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (e) => {
      if (!mountedRef.current) return;
      setError(e.error);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      if (mountedRef.current) {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mountedRef.current) setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    reset,
  };
}
