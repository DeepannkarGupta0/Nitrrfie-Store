import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export const Hero2DAnimation: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 transition-colors duration-300">
      {/* Subtle Architectural Campus Backdrop */}
      <motion.div
        key={`bg-img-${theme}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
          alt="NIT Raipur Collegiate Architecture"
          style={{
            opacity: isLight ? 0.14 : 0.1,
          }}
          className={`w-full h-full object-cover object-center filter grayscale contrast-110 ${
            isLight ? 'mix-blend-multiply' : 'mix-blend-screen'
          } transition-opacity duration-300`}
        />

        {/* Soft Directional Gradient Scrim for Crisp Typography Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--paper)] via-[var(--paper)]/90 to-[var(--paper)]/40 transition-colors duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--paper)] via-transparent to-[var(--paper)]/60 transition-colors duration-300" />
      </motion.div>

      {/* Subtle Warm Ambient Highlight */}
      <div
        className={`absolute -top-24 right-0 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-orange-500/8' : 'bg-[#FF5522]/10'
        }`}
      />
    </div>
  );
};
