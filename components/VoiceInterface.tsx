
import React from 'react';
import { TimeOfDay } from '../types';

interface VoiceInterfaceProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
  timeOfDay: TimeOfDay;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  isConnected, 
  isConnecting, 
  isSpeaking,
  onToggle,
  timeOfDay 
}) => {
  const getButtonStyles = () => {
    if (isConnecting) return 'bg-slate-300 scale-95 opacity-50 cursor-not-allowed';
    
    switch (timeOfDay) {
      case TimeOfDay.Morning:
        return isConnected ? 'bg-amber-400 shadow-amber-200 shadow-lg' : 'bg-amber-200 text-amber-900';
      case TimeOfDay.Afternoon:
        return isConnected ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900';
      case TimeOfDay.Night:
        return isConnected ? 'bg-indigo-600 shadow-indigo-900 shadow-lg text-white' : 'bg-indigo-900/30 text-indigo-200';
    }
  };

  return (
    <div className="relative group">
      {/* Waveforms / Visual feedback */}
      {isConnected && (
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className={`w-24 h-24 rounded-full animate-ping opacity-20 ${
            timeOfDay === TimeOfDay.Night ? 'bg-indigo-400' : 'bg-amber-400'
          }`} />
          {isSpeaking && (
            <div className={`absolute w-32 h-32 rounded-full animate-pulse-soft opacity-10 ${
              timeOfDay === TimeOfDay.Night ? 'bg-indigo-400' : 'bg-amber-400'
            }`} />
          )}
        </div>
      )}

      <button
        onClick={onToggle}
        disabled={isConnecting}
        className={`
          relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500
          hover:scale-105 active:scale-95 focus:outline-none touch-manipulation
          ${getButtonStyles()}
        `}
      >
        {isConnecting ? (
          <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" />
        ) : isConnected ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        )}
      </button>
      
      <p className={`mt-4 text-xs font-semibold uppercase tracking-widest text-center transition-opacity ${isConnected ? 'opacity-100' : 'opacity-40'}`}>
        {isConnecting ? 'Waking up...' : isConnected ? 'I am listening' : 'Tap to speak'}
      </p>
    </div>
  );
};

export default VoiceInterface;
