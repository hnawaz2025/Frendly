
import React, { useEffect, useState, useId } from 'react';

interface MascotProps {
  openUrl?: string;
  closedUrl?: string;
  size?: string;
  className?: string;
  isAnimated?: boolean;
  isSpeaking?: boolean;
}

/**
 * Frendly Mascot Component
 * Uses a precise SVG Luminance Mask to remove white/light backgrounds dynamically.
 * Features a binary alpha transfer to ensure whites within the mascot (eyes) remain 100% solid.
 */
const Mascot: React.FC<MascotProps> = ({ 
  openUrl = 'https://lh3.googleusercontent.com/d/1Rq7Iq8PLZyMsEreh9vUvIHHhYOtP3AEU', 
  closedUrl = 'https://lh3.googleusercontent.com/d/1C5Yl1O8OoPZAzjL7VywrgT38tkcpHFbE', 
  size = '100%', 
  className = '', 
  isAnimated = false,
  isSpeaking = false 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Unique IDs for SVG definitions to prevent conflicts
  const uniqueId = useId().replace(/:/g, "");
  const maskIdOpen = `mask-open-${uniqueId}`;
  const maskIdClosed = `mask-closed-${uniqueId}`;
  const filterId = `smart-mask-${uniqueId}`;

  // Blink Logic
  useEffect(() => {
    let timeoutId: number;
    const blink = () => {
      setIsOpen(false);
      setTimeout(() => setIsOpen(true), 150); // Fast blink
      
      const nextInterval = 2000 + Math.random() * 4000;
      timeoutId = window.setTimeout(blink, nextInterval);
    };

    timeoutId = window.setTimeout(blink, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className} 
        ${isAnimated ? 'animate-bounce-slow' : ''} 
        transition-transform duration-300 ease-out
        ${isSpeaking ? 'scale-110' : 'scale-100'}`}
      style={{ width: size, height: size, isolation: 'isolate' }}
    >
      {/* Glow Effect */}
      <div className={`absolute inset-4 rounded-full blur-[40px] transition-all duration-500 -z-10 ${
        isSpeaking ? 'bg-pink-400/50 scale-110' : 'bg-pink-300/0 scale-100'
      }`} />
      
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        style={{ display: 'block' }}
      >
        <defs>
          {/* 
            Binary Chroma Key Filter:
            1. feColorMatrix creates a sharp threshold targeting pure white backgrounds.
            2. feComponentTransfer with 'discrete' forces the alpha channel to be 0 or 1.
               This prevents semi-transparency in the eyes, which causes 'grey' eyes.
          */}
          <filter id={filterId}>
            <feColorMatrix 
              type="matrix" 
              values="-20 -20 -20 0 59.5
                      -20 -20 -20 0 59.5
                      -20 -20 -20 0 59.5
                      0   0   0   1 0" 
              result="thresholded"
            />
            <feComponentTransfer in="thresholded">
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
          </filter>

          <mask id={maskIdOpen}>
            <image 
              href={openUrl} 
              width="100" 
              height="100" 
              filter={`url(#${filterId})`} 
              crossOrigin="anonymous" 
            />
          </mask>

          <mask id={maskIdClosed}>
            <image 
              href={closedUrl} 
              width="100" 
              height="100" 
              filter={`url(#${filterId})`} 
              crossOrigin="anonymous" 
            />
          </mask>
        </defs>

        {/* Visibility toggling ensures frame-perfect swapping with no overlap artifacts */}
        <image 
          href={openUrl} 
          width="100" 
          height="100" 
          mask={`url(#${maskIdOpen})`}
          crossOrigin="anonymous"
          style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        />
        
        <image 
          href={closedUrl} 
          width="100" 
          height="100" 
          mask={`url(#${maskIdClosed})`}
          crossOrigin="anonymous"
          style={{ visibility: !isOpen ? 'visible' : 'hidden' }}
        />
      </svg>
    </div>
  );
};

export default Mascot;
