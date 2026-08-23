/**
 * App.jsx — ListEase Voice Shopping Assistant
 *
 * Implements the full ListEase "Productive Energy" UI layout:
 *   - SideNavBar (Desktop navigation)
 *   - TopNavBar (Search & user profile)
 *   - Hero greeting with central voice widget & mic
 *   - Live transcript & ConfirmChip ambiguity resolution
 *   - Search & Multi-Filter drawer
 *   - Active shopping list with bento cards & category filter pills
 *   - Smart recommendations carousels (Running Low, Seasonal, Popular, Substitutes)
 *   - Mobile bottom nav bar
 *   - Framer Motion page & micro-interaction animations
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Keyboard, Home, List as ListIcon, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useShoppingList } from './hooks/useShoppingList';
import { parseIntent, needsConfirmation } from './utils/intentParser';
import { parseVoiceIntent } from './api/apiClient';

import MicButton          from './components/MicButton';
import ShoppingList       from './components/ShoppingList';
import ConfirmChip        from './components/ConfirmChip';
import ErrorBanner        from './components/ErrorBanner';
import ParallaxBackground from './components/ParallaxBackground';
import TiltCard           from './components/TiltCard';
import BubbleMenu         from './components/BubbleMenu';

// Lazy-loaded heavy components for code splitting
const HeroShowcase    = lazy(() => import('./components/HeroShowcase'));
const SuggestionPanel = lazy(() => import('./components/SuggestionPanel'));
const SearchBar       = lazy(() => import('./components/SearchBar'));

const USER_ID = 'demo-user-001';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function App() {
  const [lang, setLang]                   = useState(import.meta.env.VITE_DEFAULT_LANG || 'en-IN');
  const navigate                          = useNavigate();
  const location                          = useLocation();
  const currentPath                       = location.pathname;
  const [pendingIntent, setPendingIntent] = useState(null);
  const [voiceSearch, setVoiceSearch]     = useState('');
  const [micError, setMicError]           = useState(null);
  const [toastError, setToastError]       = useState(null);
  const [textInput, setTextInput]         = useState('');
  const [isProcessing, setIsProcessing]   = useState(false);

  const speech = useSpeechRecognition(lang);
  const list   = useShoppingList();

  // Load shopping list on mount
  useEffect(() => {
    list.loadList(USER_ID);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Speech Errors
  useEffect(() => {
    if (!speech.error) return;

    if (speech.error === 'not-allowed' || speech.error === 'audio-capture') {
      setMicError(speech.error);
    } else if (speech.error !== 'aborted') {
      setToastError(speech.error);
      const t = setTimeout(() => setToastError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [speech.error]);

  // Hybrid Intent Resolver (AI via Groq + Local Regex Fallback)
  const resolveTranscript = useCallback(async (rawText) => {
    if (!rawText || !rawText.trim()) return null;
    try {
      const res = await parseVoiceIntent(rawText, lang);
      if (res?.success && res.intent) {
        return res.intent;
      }
    } catch {
      // Backend/AI offline or failed -> fallback silently to regex parser
    }
    return parseIntent(rawText);
  }, [lang]);

  // Handle Final Voice Transcript
  useEffect(() => {
    if (!speech.transcript) return;
    const text = speech.transcript;
    speech.reset();

    (async () => {
      setIsProcessing(true);
      try {
        const intent = await resolveTranscript(text);
        if (!intent || !intent.itemName.trim()) {
          setToastError('empty-item');
          const t = setTimeout(() => setToastError(null), 3500);
          return () => clearTimeout(t);
        }

        // Search intent
        if (intent.action === 'search') {
          setVoiceSearch(text);
          return;
        }

        // Ambiguous intent → confirm
        if (needsConfirmation(intent)) {
          setPendingIntent({ ...intent, action: 'add' });
          return;
        }

        // Execute immediately
        executeIntent(intent);
      } finally {
        setIsProcessing(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript]);

  // Execute Intent
  const executeIntent = useCallback(async (intent) => {
    setIsProcessing(true);
    try {
      if (intent.action === 'add' || intent.action === 'unknown') {
        await list.addItem(USER_ID, intent.itemName, intent.quantity, intent.unit);
      } else if (intent.action === 'remove') {
        const match = list.items.find(
          i => i.status === 'active' && i.itemName.toLowerCase().includes(intent.itemName.toLowerCase())
        );
        if (match) {
          await list.deleteItem(match._id);
        } else {
          list.clearError();
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [list]);

  const handleConfirm = useCallback(() => {
    if (pendingIntent) {
      executeIntent(pendingIntent);
      setPendingIntent(null);
    }
  }, [pendingIntent, executeIntent]);

  const handleReject = useCallback(() => {
    setPendingIntent(null);
    speech.reset();
  }, [speech]);

  const handleTextSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const input = textInput;
    setTextInput('');
    setIsProcessing(true);
    try {
      const intent = await resolveTranscript(input);
      const finalIntent = {
        ...(intent || parseIntent(input)),
        action: intent?.action === 'unknown' ? 'add' : (intent?.action || 'add'),
      };
      if (!finalIntent.itemName.trim()) return;
      if (finalIntent.action === 'search') {
        setVoiceSearch(input);
      } else {
        executeIntent(finalIntent);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [textInput, resolveTranscript, executeIntent]);

  const handleAddFromSearch = useCallback((itemName) => {
    list.addItem(USER_ID, itemName, 1, '');
  }, [list]);

  const handleExecuteDemoCommand = useCallback(async (cmd) => {
    setIsProcessing(true);
    try {
      const intent = await resolveTranscript(cmd);
      if (intent?.action === 'search') {
        setVoiceSearch(cmd);
      } else {
        executeIntent(intent?.action === 'unknown' ? { ...intent, action: 'add' } : (intent || parseIntent(cmd)));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [resolveTranscript, executeIntent]);

  const isPersistentError = micError === 'not-allowed' || micError === 'audio-capture';
  const activeCount = list.items.filter(i => i.status === 'active').length;

  const bubbleNavItems = [
    {
      label: 'Home',
      ariaLabel: 'Home',
      rotation: -6,
      onClick: () => navigate('/'),
      hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' }
    },
    {
      label: `My List (${activeCount})`,
      ariaLabel: 'My Shopping List',
      rotation: 6,
      onClick: () => navigate('/lists'),
      hoverStyles: { bgColor: '#a855f7', textColor: '#ffffff' }
    },
    {
      label: 'Picks',
      ariaLabel: 'Recommendations',
      rotation: -6,
      onClick: () => navigate('/picks'),
      hoverStyles: { bgColor: '#d946ef', textColor: '#ffffff' }
    },
    {
      label: 'Settings',
      ariaLabel: 'Settings',
      rotation: 6,
      onClick: () => navigate('/settings'),
      hoverStyles: { bgColor: '#7c3aed', textColor: '#ffffff' }
    }
  ];

  return (
    <div className="app-container">
      {/* ── Multi-Layer Parallax Background ─────────────────── */}
      <ParallaxBackground />

      {/* ── Bubble Menu Navigation ────────────────────────────── */}
      <BubbleMenu
        useFixedPosition
        menuBg="rgba(18, 13, 34, 0.82)"
        menuContentColor="#e2d9f3"
        menuAriaLabel="Toggle navigation menu"
        items={bubbleNavItems}
        animationEase="back.out(1.4)"
        animationDuration={0.45}
        staggerDelay={0.1}
        logo={
          <>
            <Mic size={22} color="#a78bfa" />
            <span style={{ color: '#e2d9f3', fontWeight: 900, fontFamily: 'Montserrat, system-ui', fontSize: '1.05rem', letterSpacing: '-0.02em', marginLeft: '4px' }}>ListEase</span>
          </>
        }
      />

      {/* ── Main Content Wrapper ────────────────────────────── */}
      <main className="main-wrapper">
        {/* Scrollable Main Area */}
        <div className="content-scrollable" style={{ paddingTop: 'calc(var(--bubble-nav-h, 80px) + var(--space-lg))' }}>
          
          {/* Global UI Components: Persistent Mic Error */}
          <AnimatePresence>
            {isPersistentError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ErrorBanner errorCode={micError} onDismiss={() => setMicError(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Interim / Final Speech Transcript with spring entrance */}
          <AnimatePresence>
            {speech.isSupported && (speech.isListening || speech.interimTranscript || speech.transcript) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="transcript-card"
                aria-live="polite"
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-primary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  {speech.isListening ? '🎙️ Listening to your voice...' : '✓ Captured Speech:'}
                </span>
                "{speech.interimTranscript || speech.transcript || 'Speak now...'}"
              </motion.div>
            )}
          </AnimatePresence>

          {(!speech.isSupported || isPersistentError) && (
            <form onSubmit={handleTextSubmit} style={{ margin: 'var(--space-md) 0' }}>
              <div className="search-input-box">
                <Keyboard size={24} color="var(--clr-text-dim)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  className="search-input"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder='Type a command, e.g. "add 2 kg apples" or "delete milk"...'
                  aria-label="Manual text command input"
                />
                <button type="submit" className="add-catalog-btn" disabled={!textInput.trim()}>
                  Submit
                </button>
              </div>
            </form>
          )}

          {/* Ambiguous Intent Confirm Chip */}
          <AnimatePresence>
            {pendingIntent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="confirm-chip-container"
              >
                <ConfirmChip
                  itemName={pendingIntent.itemName}
                  action={pendingIntent.action}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Suspense fallback={<div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--clr-text-dim)' }}>Loading...</div>}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <HeroShowcase
                    onStartVoice={() => speech.isListening ? speech.stopListening() : speech.startListening()}
                    onExecuteDemoCommand={handleExecuteDemoCommand}
                    isListening={speech.isListening}
                  />

                  <TiltCard maxTilt={3} glare className="parallax-hero-card">
                    <section className="greeting-section" style={{ margin: 0 }}>
                      <div className="greeting-text">
                        <h2>Voice Assistant Station</h2>
                        <p>{activeCount} item{activeCount === 1 ? '' : 's'} on your current shopping list</p>
                      </div>

                      <MicButton
                        isListening={speech.isListening}
                        isProcessing={isProcessing}
                        isSupported={speech.isSupported}
                        onStart={speech.startListening}
                        onStop={speech.stopListening}
                        lang={lang}
                        onLangChange={setLang}
                      />
                    </section>
                  </TiltCard>

                  <section style={{ marginTop: 'var(--space-xl)' }}>
                    <SearchBar
                      userId={USER_ID}
                      onAddFromSearch={handleAddFromSearch}
                      voiceTranscript={voiceSearch}
                      onVoiceSearchConsumed={() => setVoiceSearch('')}
                    />
                  </section>

                  <section style={{ marginTop: 'var(--space-xl)' }}>
                    <ShoppingList
                      items={list.items}
                      loading={list.loading}
                      onIncrement={list.incrementQty}
                      onDecrement={list.decrementQty}
                      onMarkPurchased={list.markPurchased}
                      onDelete={list.deleteItem}
                      isSupported={speech.isSupported}
                    />
                  </section>

                  <section style={{ marginTop: 'var(--space-xl)' }}>
                    <SuggestionPanel
                      userId={USER_ID}
                      onAddItem={handleAddFromSearch}
                      listItems={list.items}
                    />
                  </section>
                </motion.div>
              } />

              <Route path="/lists" element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <section style={{ marginTop: 'var(--space-md)' }}>
                    <SearchBar
                      userId={USER_ID}
                      onAddFromSearch={handleAddFromSearch}
                      voiceTranscript={voiceSearch}
                      onVoiceSearchConsumed={() => setVoiceSearch('')}
                    />
                  </section>

                  <section style={{ marginTop: 'var(--space-xl)' }}>
                    <ShoppingList
                      items={list.items}
                      loading={list.loading}
                      onIncrement={list.incrementQty}
                      onDecrement={list.decrementQty}
                      onMarkPurchased={list.markPurchased}
                      onDelete={list.deleteItem}
                      isSupported={speech.isSupported}
                    />
                  </section>
                </motion.div>
              } />

              <Route path="/picks" element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <section style={{ marginTop: 'var(--space-md)' }}>
                    <SearchBar
                      userId={USER_ID}
                      onAddFromSearch={handleAddFromSearch}
                      voiceTranscript={voiceSearch}
                      onVoiceSearchConsumed={() => setVoiceSearch('')}
                    />
                  </section>

                  <section style={{ marginTop: 'var(--space-xl)' }}>
                    <SuggestionPanel
                      userId={USER_ID}
                      onAddItem={handleAddFromSearch}
                      listItems={list.items}
                    />
                  </section>
                </motion.div>
              } />

              <Route path="/settings" element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <section style={{ marginTop: 'var(--space-xl)', background: 'var(--clr-surface)', border: '1px solid var(--clr-divider)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                    <h3 className="font-headline-sm" style={{ marginBottom: 'var(--space-md)' }}>App Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                      <div>
                        <label className="font-label-caps" style={{ color: 'var(--clr-text-muted)' }}>Default Voice Language</label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 6 }}>
                          <button
                            type="button"
                            className={`cat-pill${lang === 'en-IN' ? ' active' : ''}`}
                            onClick={() => setLang('en-IN')}
                          >
                            English (India) - en-IN
                          </button>
                          <button
                            type="button"
                            className={`cat-pill${lang === 'hi-IN' ? ' active' : ''}`}
                            onClick={() => setLang('hi-IN')}
                          >
                            Hindi - hi-IN
                          </button>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--clr-divider)', paddingTop: 'var(--space-md)' }}>
                        <p className="font-label-caps" style={{ color: 'var(--clr-text-muted)' }}>User Session</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-1)', marginTop: 4 }}>ID: <code>{USER_ID}</code></p>
                      </div>
                    </div>
                  </section>
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
          </Suspense>

          {/* API Error Alert */}
          <AnimatePresence>
            {list.error && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                style={{ marginTop: 'var(--space-md)' }}
              >
                <ErrorBanner title="List Operation Error" message={list.error} onDismiss={list.clearError} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transient Toast Notification */}
          <AnimatePresence>
            {list.toast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="toast-msg"
                role="status"
                aria-live="polite"
              >
                {list.toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transient Error Toast */}
          <AnimatePresence>
            {toastError && toastError !== 'empty-item' && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="toast-msg"
                style={{ borderColor: 'var(--clr-warning)' }}
              >
                ⚠️ Didn't catch that. Please try speaking again.
              </motion.div>
            )}
            {toastError === 'empty-item' && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="toast-msg"
                style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }}
              >
                ❗ What item would you like to add? Please say an item name.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────── */}
      <nav className="bottom-nav" aria-label="Mobile Navigation">
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          className={`bottom-nav-item${currentPath === '/' ? ' active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Home size={24} />
          <span>Home</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          className={`bottom-nav-item${currentPath === '/lists' ? ' active' : ''}`}
          onClick={() => navigate('/lists')}
        >
          <ListIcon size={24} />
          <span>List</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          className={`bottom-nav-item${speech.isListening ? ' active' : ''}`}
          onClick={() => speech.isListening ? speech.stopListening() : speech.startListening()}
        >
          <Mic size={24} color={speech.isListening ? 'var(--clr-primary)' : 'inherit'} />
          <span>Mic</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          className={`bottom-nav-item${currentPath === '/picks' ? ' active' : ''}`}
          onClick={() => navigate('/picks')}
        >
          <Sparkles size={24} />
          <span>Picks</span>
        </motion.button>
      </nav>
    </div>
  );
}
