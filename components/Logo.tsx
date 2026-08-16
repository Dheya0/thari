
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  hashtag?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 48, className = "", showText = false, hashtag }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {hashtag && (
        <div className="mb-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-wide shadow-sm animate-pulse">
          <span>{hashtag}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="relative select-none" style={{ width: size, height: size }}>
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-2xl"
          >
            <defs>
              <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />   {/* Amber 400 */}
                <stop offset="50%" stopColor="#d97706" />   {/* Amber 600 */}
                <stop offset="100%" stopColor="#b45309" />  {/* Amber 700 */}
              </linearGradient>
              <linearGradient id="dark-glass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* الخلفية: شكل هندسي ناعم بلون داكن فاخر */}
            <rect x="5" y="5" width="90" height="90" rx="28" fill="url(#dark-glass)" stroke="url(#gold-gradient)" strokeWidth="1.5" strokeOpacity="0.3" />

            {/* الرمز: أعمدة النمو الثلاثة (تمثل نقاط حرف الثاء + رسم بياني) */}
            {/* العمود الأيسر - بداية النمو */}
            <rect x="24" y="45" width="12" height="20" rx="6" fill="url(#gold-gradient)" filter="url(#glow)" />
            
            {/* العمود الأوسط - القمة (الثروة) */}
            <rect x="44" y="25" width="12" height="40" rx="6" fill="url(#gold-gradient)" filter="url(#glow)" />
            
            {/* العمود الأيمن - الاستدامة */}
            <rect x="64" y="35" width="12" height="30" rx="6" fill="url(#gold-gradient)" filter="url(#glow)" />

            {/* المنحنى السفلي: يمثل الابتسامة أو الوعاء (جسم حرف الثاء) */}
            <path 
              d="M 24 78 Q 50 92 76 78" 
              stroke="url(#gold-gradient)" 
              strokeWidth="5" 
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>
        </div>
        
        {showText && (
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
              ثـري
            </h1>
            <span className="text-[9px] text-amber-500 font-bold tracking-[0.3em] uppercase opacity-80 mt-1">
              THARI
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;
