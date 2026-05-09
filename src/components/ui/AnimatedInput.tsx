import React from 'react';
import { cn } from '../../utils/cn';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        {/* Glow effect that activates on focus-within */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
        
        <div className="relative flex items-center bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-colors focus-within:border-white/20 focus-within:bg-[#0B1120]">
          {icon && (
            <div className="pl-6 pr-3 text-white/40 group-focus-within:text-purple-400 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-transparent border-none py-4 px-4 text-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-0",
              !icon && "pl-6",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';
