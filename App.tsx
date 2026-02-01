
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimeOfDay, Message } from './types';
import Header from './components/Header';
import VoiceInterface from './components/VoiceInterface';
import TranscriptionList from './components/TranscriptionList';
import WeatherEffects from './components/WeatherEffects';
import Mascot from './components/Mascot';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { 
  decodeBase64, 
  encodeBase64, 
  decodeAudioData, 
  floatTo16BitPCM 
} from './utils/audioUtils';

// Extend window for AI Studio key management
// Fix: Use the AIStudio interface and ensure property modifiers match the global environment
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(TimeOfDay.Morning);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Mascot Assets
  const MASCOT_OPEN = "https://lh3.googleusercontent.com/d/1Rq7Iq8PLZyMsEreh9vUvIHHhYOtP3AEU";
  const MASCOT_CLOSED = "https://lh3.googleusercontent.com/d/1C5Yl1O8OoPZAzjL7VywrgT38tkcpHFbE";

  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentTranscriptionRef = useRef({ user: '', model: '' });
  const lastGeneratedKey = useRef<string>("");

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const data = await response.json();
      if (data.current_weather) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          description: getWeatherDescription(data.current_weather.weathercode)
        });
        return data.current_weather;
      }
    } catch (error) {
      console.error("Weather fetch failed", error);
    }
    return null;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "clear skies";
    if (code <= 3) return "partly cloudy";
    if (code <= 67) return "softly raining";
    if (code <= 77) return "lightly snowing";
    return "stormy and misty";
  };

  const generateBackground = useCallback(async (time: TimeOfDay, weatherDesc: string) => {
    const key = `${time}-${weatherDesc}`;
    if (key === lastGeneratedKey.current || isGeneratingBg) return;
    
    setIsGeneratingBg(true);
    lastGeneratedKey.current = key;

    try {
      // Always create a new instance to ensure we pick up the latest selected key if any
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const lighting = time === TimeOfDay.Morning ? "warm golden sunrise" : 
                       time === TimeOfDay.Afternoon ? "soft bright daylight" : "peaceful moonlight";
      
      const prompt = `Serene minimalist landscape photography. ${time} atmosphere. Weather: ${weatherDesc}. ${lighting}. Soft bokeh, ethereal nature, vertical 9:16 composition. Professional 35mm style. No people.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setBgImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            setQuotaExceeded(false);
            break;
          }
        }
      }
    } catch (error: any) {
      console.error("BG generation failed:", error);
      if (error.message?.includes('429') || error.status === 429) {
        setQuotaExceeded(true);
        setBgImageUrl(null);
      }
      if (error.message?.includes('Requested entity was not found')) {
        // Reset key selection state if the key is invalid or deleted
        window.aistudio?.openSelectKey();
      }
    } finally {
      setIsGeneratingBg(false);
    }
  }, [isGeneratingBg]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success and retry background generation
      setQuotaExceeded(false);
      if (weather) generateBackground(timeOfDay, weather.description);
    } else {
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay(TimeOfDay.Morning);
      else if (hour >= 12 && hour < 18) setTimeOfDay(TimeOfDay.Afternoon);
      else setTimeOfDay(TimeOfDay.Night);
    };
    updateTime();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      }, () => {
        setWeather({ temp: 21, description: 'clear skies' });
      });
    }

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (weather) generateBackground(timeOfDay, weather.description);
  }, [weather, timeOfDay, generateBackground]);

  const handleMessage = useCallback((message: LiveServerMessage) => {
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && audioContextOutRef.current) {
      const ctx = audioContextOutRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1).then(buffer => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.onended = () => {
          audioSourcesRef.current.delete(source);
          if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
        };
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
        audioSourcesRef.current.add(source);
        setIsSpeaking(true);
      });
    }

    if (message.serverContent?.outputTranscription) {
      currentTranscriptionRef.current.model += message.serverContent.outputTranscription.text;
    } else if (message.serverContent?.inputTranscription) {
      currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      const { user, model } = currentTranscriptionRef.current;
      if (user || model) {
        setMessages(prev => [
          ...prev,
          ...(user ? [{ id: Math.random().toString(), role: 'user' as const, text: user, timestamp: new Date() }] : []),
          ...(model ? [{ id: Math.random().toString(), role: 'model' as const, text: model, timestamp: new Date() }] : []),
        ]);
        currentTranscriptionRef.current = { user: '', model: '' };
      }
    }
  }, []);

  const startSession = async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are Frendly. A supportive, calm presence. Mirror reflections, use bullets for summaries, and keep responses focused on emotional clarity."
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const processor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const pcm = floatTo16BitPCM(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeBase64(pcm), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(audioContextInRef.current!.destination);
          },
          onmessage: handleMessage,
          onclose: () => setIsConnected(false),
          onerror: (err) => {
            console.error("Live session error:", err);
            setIsConnected(false);
            setIsConnecting(false);
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { 
      setIsConnecting(false); 
      console.error("Failed to start session:", e);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    setIsConnected(false);
  };

  const getBaseBg = () => {
    switch (timeOfDay) {
      case TimeOfDay.Morning: return 'bg-gradient-to-b from-[#fdf8f1] to-[#fcecdb]';
      case TimeOfDay.Afternoon: return 'bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef]';
      case TimeOfDay.Night: return 'bg-gradient-to-b from-[#121420] to-[#0a0c14]';
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden font-inter select-none transition-colors duration-[2000ms] ${getBaseBg()}`}>
      
      {/* Generated Background Layer */}
      {bgImageUrl && (
        <div className="absolute inset-0 z-0 opacity-100 animate-in fade-in duration-[3000ms]"
          style={{ 
            backgroundImage: `url(${bgImageUrl})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
          }}>
          <div className={`absolute inset-0 ${timeOfDay === TimeOfDay.Night ? 'bg-black/40' : 'bg-black/10'} backdrop-blur-[1.5px]`} />
        </div>
      )}

      {weather && <WeatherEffects description={weather.description} />}

      <div className={`relative z-10 flex flex-col h-full ${timeOfDay === TimeOfDay.Night ? 'text-white' : 'text-slate-900'}`}>
        <Header timeOfDay={timeOfDay} openUrl={MASCOT_OPEN} closedUrl={MASCOT_CLOSED} weather={weather} />
        
        <main className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-lg mx-auto overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000">
              <div className="relative flex items-center justify-center w-[280px] h-[280px]">
                <Mascot 
                  openUrl={MASCOT_OPEN} 
                  closedUrl={MASCOT_CLOSED}
                  size="100%" 
                  isAnimated={true} 
                  isSpeaking={isSpeaking}
                />
              </div>
              
              <div className="space-y-4 max-w-[320px]">
                <h2 className="text-4xl font-quicksand font-bold tracking-tight drop-shadow-sm">Hi, I'm Frendly.</h2>
                <p className="text-xl font-medium opacity-80 leading-relaxed">
                  {weather ? `A ${weather.description} ${timeOfDay.toLowerCase()}. Ready to clear some space together?` : "I'm ready to listen."}
                </p>
                {quotaExceeded && (
                  <button 
                    onClick={handleOpenKeySelector}
                    className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Use Personal API Key
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full overflow-y-auto pt-4 pb-32 hide-scrollbar">
              <TranscriptionList messages={messages} timeOfDay={timeOfDay} />
            </div>
          )}
        </main>

        <div className="px-6 py-10 flex flex-col items-center justify-center z-20">
          <VoiceInterface 
            isConnected={isConnected} 
            isConnecting={isConnecting}
            isSpeaking={isSpeaking}
            onToggle={isConnected ? stopSession : startSession}
            timeOfDay={timeOfDay}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
