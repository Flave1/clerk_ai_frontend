import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useUIStore } from '@/store';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
}

export default function Logo({ 
  href = '/', 
  className = '', 
  size = 'md',
  showLink = true 
}: LogoProps) {
  const { theme } = useUIStore();
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl'
  };

  const iconSizeClasses = {
    sm: 'h-[1.2em] w-[1.2em]',
    md: 'h-[1.2em] w-[1.2em]',
    lg: 'h-[1.2em] w-[1.2em]'
  };

  const logoContent = (
    <div 
      className={`flex items-center gap-0.5 sm:gap-1 relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center" 
        style={{
          filter: theme === 'dark' 
            ? 'drop-shadow(0 0 8px rgba(29, 162, 180, 0.4)) drop-shadow(0 0 12px rgba(0, 198, 174, 0.3))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}>
        <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent tracking-tight leading-none ml-0.5 sm:ml-1`}
          style={theme === 'dark' ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' } : undefined}>
          A
        </span>
        <div className={`relative ${iconSizeClasses[size]} ${sizeClasses[size]} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-30 blur-sm rounded-full" />
          <motion.div
            animate={{ scaleX: isHovered ? -1 : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="h-full w-full relative"
          >
            <svg 
              className="h-full w-full relative"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="micGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1DA2B4" />
                  <stop offset="100%" stopColor="#00C6AE" />
                </linearGradient>
              </defs>
              <path 
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" 
                stroke="url(#micGradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M19 10v2a7 7 0 0 1-14 0v-2" 
                stroke="url(#micGradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <line 
                x1="12" 
                y1="19" 
                x2="12" 
                y2="23" 
                stroke="url(#micGradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <line 
                x1="8" 
                y1="23" 
                x2="16" 
                y2="23" 
                stroke="url(#micGradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>
        <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent tracking-tight leading-none ml-0.5 sm:ml-1`}
          style={theme === 'dark' ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' } : undefined}>
          RRAY
        </span>
      </div>
    </div>
  );

  if (showLink) {
    return (
      <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
        <Link href={href}>
          {logoContent}
        </Link>
      </motion.div>
    );
  }

  return logoContent;
}

