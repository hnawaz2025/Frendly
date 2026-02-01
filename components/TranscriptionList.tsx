
import React, { useEffect, useRef } from 'react';
import { Message, TimeOfDay } from '../types';

interface TranscriptionListProps {
  messages: Message[];
  timeOfDay: TimeOfDay;
}

const TranscriptionList: React.FC<TranscriptionListProps> = ({ messages, timeOfDay }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMessageBubble = (msg: Message) => {
    const isModel = msg.role === 'model';
    const isNight = timeOfDay === TimeOfDay.Night;

    if (isModel) {
      return (
        <div key={msg.id} className="flex flex-col items-start max-w-[90%] animate-in slide-in-from-left-4 duration-500">
          <div className={`p-4 rounded-2xl rounded-tl-none font-medium text-sm leading-relaxed ${
            isNight ? 'bg-indigo-900/40 text-indigo-50 border border-indigo-800/50' : 'bg-white/70 shadow-sm text-slate-800'
          }`}>
            {msg.text.split('\n').map((line, i) => (
              <p key={i} className={line.startsWith('-') ? 'ml-2 py-0.5' : 'mb-2 last:mb-0'}>
                {line}
              </p>
            ))}
          </div>
          <span className="text-[10px] mt-1 opacity-40 uppercase font-bold tracking-widest px-1">Frendly</span>
        </div>
      );
    }

    return (
      <div key={msg.id} className="flex flex-col items-end max-w-[90%] self-end animate-in slide-in-from-right-4 duration-500">
        <div className={`p-4 rounded-2xl rounded-tr-none text-sm font-medium ${
          isNight ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white shadow-md'
        }`}>
          {msg.text}
        </div>
        <span className="text-[10px] mt-1 opacity-40 uppercase font-bold tracking-widest px-1">You</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-6 pb-4">
      {messages.map(getMessageBubble)}
      <div ref={bottomRef} />
    </div>
  );
};

export default TranscriptionList;
