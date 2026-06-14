'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [playedAudio, setPlayedAudio] = useState(false);

  const playSound = () => {
    if (playedAudio) return;
    setPlayedAudio(true);
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      
      // Warm Sub-Bass drone (Oscillator 1)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(50, audioCtx.currentTime); // Deep G
      osc1.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.2);
      
      gain1.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.4);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
      
      // Cinematic Chime (Oscillator 2)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(392, audioCtx.currentTime); // G4 chime
      osc2.frequency.setValueAtTime(784, audioCtx.currentTime + 0.25); // G5 octave jump
      
      gain2.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

      // Lowpass filter for cinematic frequency sweep
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.8);

      osc1.connect(gain1);
      gain1.connect(filter);
      filter.connect(audioCtx.destination);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 2.0);
      osc2.stop(audioCtx.currentTime + 2.0);
    } catch (err) {
      console.warn('Audio Context failed to play:', err);
    }
  };

  useEffect(() => {
    // Check if user already saw the splash screen in this session
    const hasSeen = sessionStorage.getItem('v19_splash_seen');
    if (hasSeen === 'true') {
      setVisible(false);
      return;
    }

    // Auto dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      sessionStorage.setItem('v19_splash_seen', 'true');
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={playSound}
      >
        {/* Subtle background glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-n-red/10 blur-[120px] pointer-events-none" />

        {/* Scaled text wrapper */}
        <div className="relative flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.05, 1], 
              opacity: 1,
              textShadow: [
                '0 0 10px rgba(255,92,0,0)',
                '0 0 30px rgba(255,92,0,0.6)',
                '0 0 20px rgba(255,92,0,0.4)'
              ]
            }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-black tracking-tight text-white flex items-center select-none"
          >
            <span>V19</span>
            <span className="text-n-red relative">
              Plus
              <motion.span 
                className="absolute inset-0 text-n-red blur-[15px]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                Plus
              </motion.span>
            </span>
          </motion.div>

          {/* Interactive cue */}
          {!playedAudio && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-2xs uppercase tracking-[0.3em] text-n-muted absolute top-20 md:top-28 text-center whitespace-nowrap"
            >
              Click screen for audio experience
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
