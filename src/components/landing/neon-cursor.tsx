'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function NeonCursor() {
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const dotX = useMotionValue(-200);
  const dotY = useMotionValue(-200);
  const isVisible = useRef(false);

  // Ring follows with spring (slight lag for organic feel)
  const springX = useSpring(cursorX, { stiffness: 350, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 350, damping: 28 });

  // Dot snaps immediately
  const dotSpringX = useSpring(dotX, { stiffness: 800, damping: 40 });
  const dotSpringY = useSpring(dotY, { stiffness: 800, damping: 40 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 14);
      cursorY.set(e.clientY - 14);
      dotX.set(e.clientX - 3);
      dotY.set(e.clientY - 3);
      if (!isVisible.current) isVisible.current = true;
    };

    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [cursorX, cursorY, dotX, dotY]);

  return (
    <>
      {/* Outer neon ring */}
      <motion.div
        className="fixed top-0 left-0 w-7 h-7 rounded-full border border-[#00d4ff] pointer-events-none z-[9999]"
        style={{
          x: springX,
          y: springY,
          boxShadow: '0 0 8px rgba(0,212,255,0.5)',
        }}
      />
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-[#00d4ff] pointer-events-none z-[9999]"
        style={{
          x: dotSpringX,
          y: dotSpringY,
          boxShadow: '0 0 6px #00d4ff',
        }}
      />
    </>
  );
}
