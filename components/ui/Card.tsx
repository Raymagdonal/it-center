
import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`relative group holo-card rounded-sm ${className}`} {...props}>
    {/* HUD Corner Brackets - Animated */}
    <svg className="absolute top-0 left-0 w-8 h-8 pointer-events-none text-cyan-500/50 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 10V2H10" />
    </svg>
    <svg className="absolute top-0 right-0 w-8 h-8 pointer-events-none text-cyan-500/50 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10V2H14" />
    </svg>
    <svg className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none text-cyan-500/50 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 14V22H10" />
    </svg>
    <svg className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none text-cyan-500/50 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 14V22H14" />
    </svg>
    
    {/* Techline Decoration */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

    <div className="relative z-10 h-full">
      {children}
    </div>
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 border-b border-cyan-500/10 bg-gradient-to-r from-cyan-950/20 to-transparent ${className}`} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => (
  <h3 className={`text-xl font-bold leading-none tracking-widest text-cyan-400 font-display uppercase flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,242,255,0.5)] ${className}`} {...props}>
    <span className="w-1 h-5 bg-cyan-500 mr-2 animate-pulse"></span>
    {props.children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props} />
);
