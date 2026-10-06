import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function EluivieLogo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-8 h-8', text: 'text-base' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl' },
  };

  const { icon: iconClass, text: textClass } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Precision Geometric SVG Emblem */}
      <div className={`relative ${iconClass} shrink-0`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]"
        >
          <defs>
            <linearGradient id="eluivie-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="eluivie-grad-glow" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="eluivie-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Rounded Squircle Frame */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill="#09090B"
            stroke="url(#eluivie-grad-1)"
            strokeWidth="1.8"
          />

          {/* Soft Center Glow */}
          <circle cx="24" cy="24" r="16" fill="url(#eluivie-center-glow)" />

          {/* Interlocking Monogram / Futuristic 'E' Forge Mark */}
          {/* Top Spine & Bar */}
          <path
            d="M 16 15 H 32 C 33.1 15 34 15.9 34 17 C 34 18.1 33.1 19 32 19 H 20 V 22 H 29 C 30.1 22 31 22.9 31 24 C 31 25.1 30.1 26 29 26 H 20 V 29 H 32 C 33.1 29 34 29.9 34 31 C 34 32.1 33.1 33 32 33 H 16 C 14.9 33 14 32.1 14 31 V 17 C 14 15.9 14.9 15 16 15 Z"
            fill="url(#eluivie-grad-1)"
          />

          {/* Kinetic Spark Accent */}
          <circle cx="34" cy="24" r="2" fill="#38BDF8" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline gap-1.5">
          <span className={`font-black tracking-tighter text-white ${textClass}`}>
            eluivie
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
        </div>
      )}
    </div>
  );
}
