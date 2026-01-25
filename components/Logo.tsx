
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 48, className = "", showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group" style={{ width: size, height: size }}>
        {/* Glow Effect - Cleaner for Light Mode */}
        <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/20 blur-xl rounded-full scale-150 group-hover:bg-amber-500/20 transition-all duration-700" />
        
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full drop-shadow-lg transform group-hover:rotate-12 transition-transform duration-500"
        >
          <defs>
            <linearGradient id="gold-grad" x1="20" y1="20" x2="80" y2="80">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="emerald-grad" x1="50" y1="30" x2="50" y2="70">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Outer Hexagon Shell */}
          <path 
            d="M50 5L89.5 27.5V72.5L50 95L10.5 72.5V27.5L50 5Z" 
            fill="url(#gold-grad)" 
          />
          
          {/* Inner Geometric Shield - High Contrast Dynamic Color */}
          <path 
            d="M50 15L80 32.5V67.5L50 85L20 67.5V32.5L50 15Z" 
            className="fill-white dark:fill-slate-900 transition-colors duration-500 shadow-inner"
          />

          {/* Stylized "ث" / Growth Icon */}
          <path 
            d="M35 60C35 65 42 68 50 68C58 68 65 65 65 60" 
            stroke="url(#gold-grad)" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          
          {/* AI / Smart Nodes (3 Dots of "ث") */}
          <circle cx="42" cy="50" r="3.5" fill="#34D399" className="animate-pulse" />
          <circle cx="58" cy="50" r="3.5" fill="#34D399" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          <circle cx="50" cy="42" r="4.5" fill="#10B981" className="animate-pulse" style={{ animationDelay: '0.4s' }} />

          {/* Central Growth Arrow */}
          <path 
            d="M50 75V35M50 35L42 43M50 35L58 43" 
            stroke="url(#emerald-grad)" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">ثري Thari</span>
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.25em]">المحاسب الذكي</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
