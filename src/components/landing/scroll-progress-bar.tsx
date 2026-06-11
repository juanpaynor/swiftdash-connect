'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left pointer-events-none z-[100]"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #00d4ff, #0099bb)',
        boxShadow: '0 0 8px rgba(0,212,255,0.8), 0 0 20px rgba(0,212,255,0.4)',
      }}
    />
  );
}
