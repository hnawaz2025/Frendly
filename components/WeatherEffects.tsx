
import React from 'react';

interface WeatherEffectsProps {
  description: string;
}

const WeatherEffects: React.FC<WeatherEffectsProps> = ({ description }) => {
  const desc = description.toLowerCase();

  const isRainy = desc.includes('rain') || desc.includes('stormy');
  const isSnowy = desc.includes('snow');
  const isCloudy = desc.includes('cloudy');
  const isMisty = desc.includes('misty') || desc.includes('fog');

  return (
    <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
      {/* Rain Effect */}
      {isRainy && (
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div 
              key={`rain-${i}`}
              className="absolute bg-white/30 w-[1px] h-12 animate-rain"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}
        </div>
      )}

      {/* Snow Effect */}
      {isSnowy && (
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div 
              key={`snow-${i}`}
              className="absolute bg-white rounded-full animate-snow"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 10}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>
      )}

      {/* Cloud Drifting Effect */}
      {isCloudy && (
        <div className="absolute inset-0">
          <div className="absolute top-10 left-[-10%] w-[120%] h-64 bg-white/10 blur-[80px] rounded-full animate-drift" style={{ animationDuration: '30s' }} />
          <div className="absolute top-40 right-[-10%] w-[100%] h-80 bg-white/5 blur-[100px] rounded-full animate-drift" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />
        </div>
      )}

      {/* Mist/Fog Effect */}
      {isMisty && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] animate-mist" />
      )}
    </div>
  );
};

export default WeatherEffects;
