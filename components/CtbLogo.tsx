import React from 'react';

interface CtbLogoProps {
  className?: string;
  size?: number;
}

export const CtbLogo: React.FC<CtbLogoProps> = ({ className = "w-10 h-10", size = 48 }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow & Gradient Filters */}
        <filter id="ctb-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#0077b6" />
        </linearGradient>
        <linearGradient id="pink-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff2a85" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <path
          id="text-path-bottom"
          d="M 30,100 A 70,70 0 0,0 170,100"
        />
      </defs>

      {/* Outer Cyan Ring */}
      <circle cx="100" cy="100" r="94" fill="#ffffff" stroke="#00f2fe" strokeWidth="4" />

      {/* Deep Navy Ring */}
      <circle cx="100" cy="100" r="86" fill="#ffffff" stroke="#0a2540" strokeWidth="6" />
      
      {/* Inner Thin Border */}
      <circle cx="100" cy="100" r="66" fill="#ffffff" stroke="#0077b6" strokeWidth="2" strokeDasharray="3 2" />

      {/* Top Helm / Steering Wheel Spoke (Gold) */}
      <g transform="translate(100, 36)">
        <circle cx="0" cy="0" r="6" fill="url(#gold-grad)" />
        <path d="M -3,0 L -8,-8 L 8,-8 L 3,0 Z" fill="url(#gold-grad)" />
        <circle cx="0" cy="-8" r="3" fill="#fbbf24" />
      </g>

      {/* Curved Text: CHAOPHRAYA TOURIST BOAT */}
      <text fill="#0a2540" fontSize="10.5" fontWeight="900" letterSpacing="1.8" fontFamily="'Rajdhani', 'Arial Black', sans-serif">
        <textPath href="#text-path-bottom" startOffset="50%" textAnchor="middle">
          CHAOPHRAYA TOURIST BOAT
        </textPath>
      </text>

      {/* Central Brand Letters: CTB */}
      <g id="ctb-letters">
        {/* Letter C */}
        <path
          d="M 68,78 C 65,70 56,70 48,76 C 38,84 38,108 48,116 C 56,122 65,122 68,114"
          fill="none"
          stroke="url(#cyan-grad)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Letter T (Main Bar + Crossbar) */}
        <path
          d="M 74,74 L 126,74 M 100,74 L 100,120"
          fill="none"
          stroke="url(#cyan-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Letter B */}
        <path
          d="M 132,74 L 146,74 C 156,74 162,79 162,87 C 162,94 156,97 148,97 L 132,97 L 132,74 Z M 132,97 L 148,97 C 158,97 164,103 164,111 C 164,119 156,120 146,120 L 132,120 L 132,97 Z"
          fill="none"
          stroke="url(#cyan-grad)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Anchor (Pink/Magenta ⚓ at the bottom of T) */}
      <g id="anchor" transform="translate(100, 118)">
        {/* Anchor Ring */}
        <circle cx="0" cy="-6" r="4" fill="none" stroke="url(#pink-grad)" strokeWidth="3" />
        
        {/* Anchor Stock (Crossbar) */}
        <line x1="-12" y1="0" x2="12" y2="0" stroke="url(#pink-grad)" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Anchor Shank (Vertical) */}
        <line x1="0" y1="-3" x2="0" y2="16" stroke="url(#pink-grad)" strokeWidth="4" />
        
        {/* Anchor Arms & Flukes (Curved Crescent) */}
        <path
          d="M -18,8 C -14,22 14,22 18,8"
          fill="none"
          stroke="url(#pink-grad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Left Arrow/Fluke */}
        <path d="M -20,6 L -16,10 L -22,12 Z" fill="url(#pink-grad)" />
        {/* Right Arrow/Fluke */}
        <path d="M 20,6 L 16,10 L 22,12 Z" fill="url(#pink-grad)" />
      </g>
    </svg>
  );
};
