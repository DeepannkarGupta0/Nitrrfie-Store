import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();

  // Gentle, highly responsive spring for an organic, editorial gliding feel
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.0005,
  });

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none select-none bg-transparent"
    >
      {/* Subtle background track */}
      <div className="absolute inset-0 bg-transparent" />

      {/* Spring-animated progress line */}
      <motion.div
        className="h-full w-full bg-gradient-to-r from-[var(--accent)] via-[#ff6a3c] to-[var(--accent)] origin-left shadow-[0_0_8px_rgba(224,62,21,0.5)]"
        style={{ scaleX }}
      />
    </div>
  );
};
