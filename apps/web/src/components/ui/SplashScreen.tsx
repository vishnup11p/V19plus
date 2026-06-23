'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Config ──────────────────────────────────────────────────────────────────
const BLADE_COUNT   = 8;
const LOGO_HOLD     = 1.8;   // seconds the logo stays centred
const SHUTTER_DUR   = 0.85;  // seconds for the shutter to open
const FADE_OUT_DUR  = 0.25;  // final fade-out of the wrapper

/** Compute a triangular polygon slice from the centre to a conic arc. */
function bladeClip(i: number, total: number): string {
  const step = 360 / total;
  const from = step * i;
  const to   = step * (i + 1);
  const pts  = ['50% 50%'];
  for (let s = 0; s <= 6; s++) {
    const a = ((from + ((to - from) * s) / 6) * Math.PI) / 180;
    pts.push(`${50 + 55 * Math.cos(a)}% ${50 + 55 * Math.sin(a)}%`);
  }
  return `polygon(${pts.join(',')})`;
}

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [opening, setOpening] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);

  // Pre-compute blade clip-paths so they're not recalculated on every render
  const bladeClips = useMemo(
    () => Array.from({ length: BLADE_COUNT }, (_, i) => bladeClip(i, BLADE_COUNT)),
    [],
  );

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem('v19_splash_seen') === 'true') {
      setVisible(false);
      return;
    }

    // After the logo hold, trigger the shutter opening
    const t1 = setTimeout(() => setOpening(true), LOGO_HOLD * 1000);

    // After shutter finishes, remove the splash
    const t2 = setTimeout(() => {
      sessionStorage.setItem('v19_splash_seen', 'true');
      setVisible(false);
    }, (LOGO_HOLD + SHUTTER_DUR + FADE_OUT_DUR + 0.1) * 1000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ─── Cinematic sound ─────────────────────────────────────────────────────
  const playSound = useCallback(() => {
    if (audioPlayed) return;
    setAudioPlayed(true);
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ac = new Ctx();
      const t = ac.currentTime;

      // Sub-bass sweep
      const o1 = ac.createOscillator();
      const g1 = ac.createGain();
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(45, t);
      o1.frequency.exponentialRampToValueAtTime(110, t + 1.4);
      g1.gain.setValueAtTime(0.01, t);
      g1.gain.linearRampToValueAtTime(0.4, t + 0.35);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 2);

      // Chime
      const o2 = ac.createOscillator();
      const g2 = ac.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(392, t);
      o2.frequency.setValueAtTime(784, t + 0.3);
      g2.gain.setValueAtTime(0.01, t);
      g2.gain.linearRampToValueAtTime(0.2, t + 0.35);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      // Shutter click (noise burst)
      const len = ac.sampleRate * 0.05;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const ch = buf.getChannelData(0);
      for (let j = 0; j < len; j++) ch[j] = (Math.random() * 2 - 1) * 0.25;
      const ns = ac.createBufferSource();
      ns.buffer = buf;
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(0.5, t + LOGO_HOLD - 0.02);
      gn.gain.exponentialRampToValueAtTime(0.001, t + LOGO_HOLD + 0.06);

      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(2000, t + 0.9);

      o1.connect(g1).connect(lp).connect(ac.destination);
      o2.connect(g2).connect(ac.destination);
      ns.connect(gn).connect(ac.destination);
      o1.start(); o2.start(); ns.start();
      o1.stop(t + 2.2); o2.stop(t + 2.2);
      ns.stop(t + LOGO_HOLD + 0.12);
    } catch {
      // Audio context may fail silently
    }
  }, [audioPlayed]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash-root"
        className="fixed inset-0 z-[9999] select-none cursor-pointer"
        style={{ willChange: 'opacity' }}
        onClick={playSound}
        exit={{ opacity: 0 }}
        transition={{ duration: FADE_OUT_DUR, ease: 'easeOut' }}
      >
        {/* ── Black base ──────────────────────────────────────────── */}
        <div className="absolute inset-0 bg-black" />

        {/* ── Ambient glow ────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: opening ? 0 : 0.8 }}
          transition={{ duration: opening ? 0.4 : 0.8 }}
        >
          <div
            className="w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(229,9,20,0.15) 0%, rgba(229,9,20,0.05) 40%, transparent 70%)',
              filter: 'blur(60px)',
              willChange: 'transform',
            }}
          />
        </motion.div>

        {/* ── Shutter blades ──────────────────────────────────────── */}
        {bladeClips.map((clip, i) => (
          <motion.div
            key={`blade-${i}`}
            className="absolute inset-0 bg-[#080808]"
            style={{
              clipPath: clip,
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
            }}
            animate={
              opening
                ? { scale: 2.8, opacity: 0, rotate: (i % 2 === 0 ? 18 : -18) }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={
              opening
                ? { duration: SHUTTER_DUR, ease: [0.76, 0, 0.24, 1], delay: i * 0.025 }
                : { duration: 0 }
            }
          />
        ))}

        {/* ── Dark overlay (fades with shutter) ───────────────────── */}
        <motion.div
          className="absolute inset-0 bg-black/50 pointer-events-none"
          style={{ willChange: 'opacity' }}
          animate={{ opacity: opening ? 0 : 1 }}
          transition={{ duration: SHUTTER_DUR * 0.5 }}
        />

        {/* ── Logo + branding ─────────────────────────────────────── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">



          {/* Brand text */}
          <motion.div
            className="flex items-baseline text-5xl md:text-7xl font-black tracking-tighter"
            style={{ willChange: 'transform, opacity' }}
            initial={{ opacity: 0, y: 20 }}
            animate={
              opening
                ? { opacity: 0, y: -15, scale: 1.1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={
              opening
                ? { duration: SHUTTER_DUR * 0.45, ease: 'easeIn' }
                : { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }
            }
          >
            <span className="text-white">V19</span>
            <span className="text-[#E50914] relative">
              Plus
              <motion.span
                className="absolute inset-0 text-[#E50914] blur-[10px] pointer-events-none"
                animate={{ opacity: [0.35, 0.9, 0.35] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              >
                Plus
              </motion.span>
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-gray-500 mt-3 font-medium"
            style={{ willChange: 'transform, opacity' }}
            initial={{ opacity: 0, y: 8 }}
            animate={opening ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
            transition={opening ? { duration: 0.25 } : { duration: 0.6, delay: 0.6 }}
          >
            Stream Unlimited
          </motion.p>

          {/* Horizontal accent line */}
          <motion.div
            className="absolute left-0 right-0 top-1/2 h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(229,9,20,0.3), transparent)',
              willChange: 'transform, opacity',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={opening ? { scaleX: 2.5, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            transition={opening ? { duration: SHUTTER_DUR } : { duration: 1, delay: 0.4 }}
          />
        </div>

        {/* ── Progress bar ────────────────────────────────────────── */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #E50914, #FF5761)',
              willChange: 'transform',
            }}
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ scaleX: 1 }}
            transition={{ duration: LOGO_HOLD - 0.15, ease: 'linear' }}
          />
        </div>

        {/* ── Tap prompt ──────────────────────────────────────────── */}
        {!audioPlayed && !opening && (
          <motion.p
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.25em] text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Tap for sound
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
