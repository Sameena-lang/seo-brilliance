import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Loader2, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface VoicePlayerProps {
  scanId: string;
  issueId?: string;
  className?: string;
  label?: string;
}

export function VoicePlayer({ scanId, issueId, className, label = "Listen" }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handlePlay = async () => {
    if (isPaused) {
      if (audioRef.current) {
        audioRef.current.play();
      } else if (window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await api.post('/ai/voice', { scanId, issueId }, { responseType: 'blob' });
      
      // Check if it's a JSON response (fallback)
      if (response.type === 'application/json') {
        const text = await response.text();
        const json = JSON.parse(text);
        if (json.data?.ttsUnavailable && json.data?.script) {
          if (!window.speechSynthesis) {
            toast.error("Voice playback is not supported by your browser.");
            return;
          }
          const utterance = new SpeechSynthesisUtterance(json.data.script);
          utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
          };
          synthRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
          return;
        }
      }

      // Handle Audio Blob
      const blob = new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load voice explanation");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10" 
        onClick={handlePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isPlaying ? (
          <Square className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
        {isLoading ? 'Loading...' : isPlaying ? 'Stop' : isPaused ? 'Resume' : label}
      </Button>
      {(isPlaying || isPaused) && (
        <Button variant="ghost" size="icon" className="size-8" onClick={isPlaying ? handlePause : handlePlay}>
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      )}
    </div>
  );
}
