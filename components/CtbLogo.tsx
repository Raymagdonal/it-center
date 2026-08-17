import React from 'react';

interface CtbLogoProps {
  className?: string;
  size?: number;
}

export const CtbLogo: React.FC<CtbLogoProps> = ({ className = "w-11 h-11", size = 44 }) => {
  return (
    <img
      src="/Final-CTB%20LOGO-03.png"
      alt="Final-CTB LOGO-03"
      width={size}
      height={size}
      className={`${className} object-contain`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/logo-ctb.png';
      }}
    />
  );
};

