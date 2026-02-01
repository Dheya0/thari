
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 48, className = "", showText = false }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* القاعدة الصلبة - مربع بزوايا ناعمة */}
          <rect x="10" y="10" width="80" height="80" rx="20" fill="#f59e0b" />
          
          {/* حرف الـ ث المفرغ - أسلوب سلبي (Negative Space) */}
          {/* النقطة المركزية */}
          <circle cx="50" cy="40" r="8" fill="#0f172a" />
          {/* النقطة اليمنى */}
          <circle cx="70" cy="65" r="8" fill="#0f172a" />
          {/* النقطة اليسرى */}
          <circle cx="30" cy="65" r="8" fill="#0f172a" />
          
          {/* خط الاتصال السفلي (ابتسامة الثراء / الوعاء) */}
          <path d="M30 65C30 80 70 80 70 65" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      
      {showText && (
        <h1 className="text-3xl font-black text-white tracking-tighter">
          ثـري
        </h1>
      )}
    </div>
  );
};

export default Logo;
