
import React from 'react';
import { TimeOfDay } from '../types';
import Mascot from './Mascot';

interface HeaderProps {
  timeOfDay: TimeOfDay;
  openUrl: string;
  closedUrl: string;
  weather: { temp: number; description: string } | null;
}

const Header: React.FC<HeaderProps> = ({ timeOfDay, openUrl, closedUrl, weather }) => {
  const getGreeting = () => {
    switch (timeOfDay) {
      case TimeOfDay.Morning: return 'Good morning';
      case TimeOfDay.Afternoon: return 'Good afternoon';
      case TimeOfDay.Night: return 'Good evening';
    }
  };

  const getWeatherIcon = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('clear')) return '☀️';
    if (d.includes('cloudy')) return '☁️';
    if (d.includes('rain')) return '🌧️';
    if (d.includes('snow')) return '❄️';
    return '⛅';
  };

  return (
    <header className="px-6 py-6 flex items-center justify-between w-full max-w-lg mx-auto z-20">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-quicksand font-bold tracking-tight">
            {getGreeting()}
          </h1>
          {weather && (
            <div className="flex items-center px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <span className="mr-1">{getWeatherIcon(weather.description)}</span>
              <span>{weather.temp}°</span>
            </div>
          )}
        </div>
        <p className="text-xs opacity-60 font-medium">
          {weather ? `It's ${weather.description} outside.` : 'Steady breaths, calm steps.'}
        </p>
      </div>
      
      <div className="w-12 h-12 flex items-center justify-center overflow-visible">
        <Mascot openUrl={openUrl} closedUrl={closedUrl} size="44px" />
      </div>
    </header>
  );
};

export default Header;
