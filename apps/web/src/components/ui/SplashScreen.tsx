'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SHUTTER_COUNT = 10;

export function SplashScreen() {
  const [phase, setPhase] = useState<'logo' | 'shutters' | 'done'>('logo');

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('v19_splash_seen');
    if (hasSeen === 'true') {
      setPhase('done');
      return;
    }

    // Phase 1: Show logo for 1.6s
    const t1 = setTimeout(() => setPhase('shutters'), 1600);
    // Phase 2: Shutters open (600ms stagger + 400ms settle = ~1.2s)
    const t2 = setTimeout(() => {
      sessionStorage.setItem('v19_splash_seen', 'true');
      setPhase('done');
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">

        {/* ── Shutter strips (render behind logo, open on 'shutters' phase) ── */}
        {Array.from({ length: SHUTTER_COUNT }).map((_, i) => {
          const goLeft = i % 2 === 0;
          return (
            <motion.div
              key={i}
              className="absolute left-0 right-0 bg-black"
              style={{
                top: `${(i / SHUTTER_COUNT) * 100}%`,
                height: `${100 / SHUTTER_COUNT}%`,
              }}
              initial={{ x: 0 }}
              animate={
                phase === 'shutters'
                  ? { x: goLeft ? '-100%' : '100%' }
                  : { x: 0 }
              }
              transition={{
                duration: 0.55,
                delay: phase === 'shutters' ? i * 0.045 : 0,
                ease: [0.76, 0, 0.24, 1],
              }}
            />
          );
        })}

        {/* ── Logo layer (sits on top of shutters, fades out when shutters open) ── */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          animate={phase === 'shutters' ? { opacity: 0, scale: 1.08 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        >
          {/* Ambient glow */}
          <div className="absolute w-[420px] h-[420px] rounded-full bg-[#FF5C00]/15 blur-[90px] pointer-events-none" />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, filter: 'blur(12px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center select-none"
          >
            {/* Letter mark */}
            <span className="text-[80px] md:text-[110px] font-black tracking-tight text-white leading-none">
              V19
            </span>
            <motion.span
              className="text-[80px] md:text-[110px] font-black tracking-tight text-[#FF5C00] leading-none relative"
              animate={{ textShadow: ['0 0 0px #FF5C00', '0 0 40px #FF5C00', '0 0 20px #FF5C00'] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            >
              Plus
              {/* Glow clone */}
              <motion.span
                className="absolute inset-0 text-[#FF5C00] blur-[22px] select-none"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              >
                Plus
              </motion.span>
            </motion.span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
            className="mt-4 text-xs uppercase tracking-[0.35em] text-white/40 font-semibold"
          >
            Stream Unlimited
          </motion.p>

          {/* Bottom progress bar */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-white/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-[#FF5C00] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
