
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  
  const baseStyles = "relative inline-flex items-center justify-center font-bold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none font-display clip-corner group overflow-hidden";
  
  const variants = {
    primary: "bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(0,242,255,0.8)] border-none text-shadow-sm",
    secondary: "bg-slate-900 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-950 hover:border-cyan-400 hover:text-white hover:shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]",
    outline: "bg-transparent border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.4)]",
    ghost: "text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 backdrop-blur-sm",
    danger: "bg-red-900/80 text-red-100 border border-red-500 hover:bg-red-700 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]",
  };

  const sizes = {
    sm: "h-8 px-4 text-[10px]",
    md: "h-12 px-8 text-xs",
    lg: "h-14 px-10 text-sm",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Scan effect overlay */}
      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out skew-x-12"></div>
      
      {isLoading && (
        <span className="mr-2 flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
      )}
      
      <span className="relative z-10 flex items-center gap-2 group-hover:scale-105 transition-transform duration-200">
        {children}
      </span>
      
      {/* Decorative corners for outline/secondary */}
      {(variant === 'outline' || variant === 'secondary') && (
        <>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        </>
      )}
    </button>
  );
};
