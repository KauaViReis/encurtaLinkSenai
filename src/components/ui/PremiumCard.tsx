import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PremiumCardProps extends HTMLMotionProps<'div'> {
  hoverEffect?: boolean;
  intensity?: 'light' | 'heavy';
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, children, hoverEffect = false, intensity = 'light', ...props }, ref) => {
    
    const baseClass = intensity === 'heavy' ? 'glass-panel-heavy' : 'glass-panel';
    const hoverClass = hoverEffect ? 'hover:bg-white/[0.08] transition-colors duration-300' : '';

    return (
      <motion.div
        ref={ref}
        className={cn(baseClass, hoverClass, 'rounded-3xl relative overflow-hidden', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';
