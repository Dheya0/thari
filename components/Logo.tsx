
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 48, className = "", showText = false }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative group" style={{ width: size, height: size }}>
        {/* Halo Glow - Soft Golden Aura */}
        <div className="absolute inset-0 bg-amber-500/20 blur-[20px] rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="gold-elite" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="emerald-core" x1="50" y1="20" x2="50" y2="80">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer Shield - Polished Hexagon */}
          <path 
            d="M50 2L93.3 27V73L50 98L6.7 73V27L50 2Z" 
            fill="url(#gold-elite)" 
            className="opacity-100"
          />
          
          {/* Inner Dark Cavity for Depth */}
          <path 
            d="M50 10L86.6 31V69L50 90L13.4 69V31L50 10Z" 
            className="fill-slate-900"
          />

          {/* The Luxury "ث" Symbol Base */}
          <path 
            d="M30 65C30 72 40 76 50 76C60 76 70 72 70 65" 
            stroke="url(#gold-elite)" 
            strokeWidth="7" 
            strokeLinecap="round" 
            className="drop-shadow-sm"
          />
          
          {/* Growth Pillar (Integral part of "ث") */}
          <path 
            d="M50 80V40M50 40L40 50M50 40L60 50" 
            stroke="url(#emerald-core)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            filter="url(#glow)"
          />

          {/* Three Elite Nodes (The Dots of "ث") - Larger and Glowing */}
          <circle cx="38" cy="52" r="5" fill="#34D399" filter="url(#glow)" className="animate-pulse" />
          <circle cx="62" cy="52" r="5" fill="#34D399" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          <circle cx="50" cy="40" r="6" fill="#10B981" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white leading-none tracking-tight">ثـري</span>
          <div className="flex items-center gap-1.5 mt-1">
             <div className="h-0.5 w-3 bg-amber-500 rounded-full"></div>
             <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">التميز المالي</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
