import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlowButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, children, isLoading, variant = 'primary', ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-white text-black hover:bg-gray-100",
      secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
      danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={variant === 'primary' ? { scale: 1.02 } : {}}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {/* Glow Background for Primary Variant */}
        {variant === 'primary' && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600 via-blue-500 to-purple-600 opacity-0 transition-opacity duration-500 hover:opacity-100 blur-xl" />
        )}

        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

GlowButton.displayName = 'GlowButton';
