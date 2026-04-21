'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { animate, createScope } from 'animejs';
import { ArrowLeft, ExternalLink, Play, Pause, SkipBack, SkipForward, Space } from 'lucide-react';
import { audioTracks } from '@/lib/data';

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export function MusicPage({ onBack }: { onBack: () => void }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(9).fill(15));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const trackIndexRef = useRef(currentTrackIndex);

  useEffect(() => { trackIndexRef.current = currentTrackIndex; }, [currentTrackIndex]);

  const currentTrack = currentTrackIndex >= 0 ? audioTracks[currentTrackIndex] : null;

  // Create audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Load track when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentTrackIndex < 0) return;

    const track = audioTracks[currentTrackIndex];
    if (!track) return;

    audio.src = track.src;
    audio.load();
    progressRef.current = 0;
    // Reset progress via ref to avoid synchronous setState in effect
    requestAnimationFrame(() => setProgress(0));

    const handleLoaded = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Auto-advance to next track
      setCurrentTrackIndex((prev) => {
        const next = (prev + 1) % audioTracks.length;
        return next;
      });
    };

    const handleTimeUpdate = () => {
      progressRef.current = audio.currentTime;
      setProgress(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    if (isPlaying) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentTrackIndex]);

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentTrackIndex < 0) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % audioTracks.length);
    setIsPlaying(true);
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev <= 0 ? audioTracks.length - 1 : prev - 1));
    setIsPlaying(true);
  }, []);

  const selectTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentTrackIndex === -1) selectTrack(0);
    else setIsPlaying((p) => !p);
  }, [currentTrackIndex, selectTrack]);

  // Visualizer timer
  useEffect(() => {
    if (isPlaying) {
      vizTimerRef.current = setInterval(() => {
        setBarHeights(Array.from({ length: 9 }, () => 15 + Math.random() * 75));
      }, 250);
    } else {
      if (vizTimerRef.current) clearInterval(vizTimerRef.current);
      // Reset bar heights asynchronously to avoid synchronous setState in effect
      requestAnimationFrame(() => setBarHeights(Array(9).fill(15)));
    }
    return () => {
      if (vizTimerRef.current) clearInterval(vizTimerRef.current);
    };
  }, [isPlaying]);

  // Animate visualizer bars with anime.js
  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll<HTMLElement>('.viz-bar');
    bars.forEach((bar, i) => {
      animate(bar, {
        height: `${isPlaying ? barHeights[i] ?? 15 : 15}%`,
        duration: 200,
        ease: 'outSine',
      });
    });
  }, [barHeights, isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') nextTrack();
      else if (e.key === 'ArrowLeft') prevTrack();
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [togglePlay, nextTrack, prevTrack]);

  // Entrance
  useEffect(() => {
    const scope = createScope();
    scopeRef.current = scope;
    scope.add(() => {
      animate('#musicPage', { opacity: [0, 1], duration: 800, ease: 'outCubic' });
      animate('.track-item', {
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 400,
        delay: (_el: Element, i: number) => i * 40,
        ease: 'outCubic',
      });
    });
    return () => scope.revert();
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !currentTrack || !isFinite(duration) || duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const newTime = pct * duration;
      audio.currentTime = newTime;
      setProgress(newTime);
      if (!isPlaying) setIsPlaying(true);
    },
    [currentTrack, isPlaying, duration]
  );

  return (
    <div
      id="musicPage"
      className="relative z-[5] flex flex-col h-screen max-w-[900px] mx-auto px-8 pt-10"
      style={{ opacity: 0 }}
    >
      <h1
        className="font-display font-extrabold tracking-[0.15em] uppercase mb-10 select-none"
        style={{ fontSize: 'clamp(38px, 6vw, 68px)' }}
      >
        Music
      </h1>

      {/* Player */}
      <div className="music-player-row flex gap-7 mb-8 items-center max-[600px]:flex-col max-[600px]:text-center">
        {/* Album art / visualizer */}
        <div
          className="music-art w-40 h-40 shrink-0 bg-white/[0.03] rounded-lg border border-white/[0.05] flex items-center justify-center overflow-hidden transition-colors duration-500 max-[600px]:w-28 max-[600px]:h-28"
          style={{ borderColor: isPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' }}
        >
          <div ref={barsRef} className="flex gap-[3px] items-end h-14">
            {barHeights.map((_, i) => (
              <div
                key={i}
                className="viz-bar w-[5px] bg-white rounded-t-sm"
                style={{ height: '15%' }}
              />
            ))}
          </div>
        </div>

        {/* Track info + controls */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-[22px] text-white truncate">
              {currentTrack ? currentTrack.title : 'No Track Selected'}
            </h2>
            <p className="font-mono text-[13px] text-white/40 mt-1">
              {currentTrack ? currentTrack.artist : '---'}
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-1 bg-white/[0.08] rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white rounded-full relative transition-[width] duration-100 ease-linear group-hover:bg-white/80"
              style={{ width: (currentTrack && isFinite(duration) && duration > 0) ? `${(progress / duration) * 100}%` : '0%' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex justify-between font-mono text-[11px] text-white/30">
            <span>{currentTrack ? formatTime(progress) : '0:00'}</span>
            <span>{currentTrack && isFinite(duration) && duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <button onClick={prevTrack} className="text-white/60 hover:text-white hover:scale-110 transition-all duration-200 cursor-pointer bg-transparent border-none p-0">
              <SkipBack size={22} strokeWidth={1.5} />
            </button>
            <button onClick={togglePlay} className="text-white hover:scale-110 transition-all duration-200 cursor-pointer bg-transparent border-none p-0">
              {isPlaying ? <Pause size={30} strokeWidth={1.5} /> : <Play size={30} strokeWidth={1.5} />}
            </button>
            <button onClick={nextTrack} className="text-white/60 hover:text-white hover:scale-110 transition-all duration-200 cursor-pointer bg-transparent border-none p-0">
              <SkipForward size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto border-t border-white/[0.04] pt-3 custom-scrollbar">
        {audioTracks.map((track, index) => (
          <div
            key={track.title}
            className={`track-item flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer border transition-all duration-300 mb-1 ${
              currentTrackIndex === index
                ? 'bg-transparent border-white/80'
                : 'border-transparent hover:bg-white/[0.02]'
            }`}
            style={{ opacity: 0 }}
            onClick={() => selectTrack(index)}
          >
            <span className={`font-mono text-xs w-5 text-center transition-colors duration-300 ${currentTrackIndex === index ? 'text-white' : 'text-white/25'}`}>
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm truncate transition-colors duration-300 ${currentTrackIndex === index ? 'text-white' : 'text-white/70'}`}>
                {track.title}
              </div>
              <div className={`font-mono text-[11px] mt-0.5 truncate transition-colors duration-300 ${currentTrackIndex === index ? 'text-white/50' : 'text-white/30'}`}>
                {track.artist}
              </div>
            </div>
            <span className={`font-mono text-[11px] px-2 py-1 rounded transition-all duration-300 ${
              currentTrackIndex === index
                ? 'bg-white text-black'
                : 'bg-white/[0.04] text-white/35'
            }`}>
              {currentTrackIndex === index && isFinite(duration) && duration > 0
                ? formatTime(duration)
                : '--:--'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className="music-footer shrink-0 flex items-center justify-between px-8 py-4 border-t border-white/[0.04] bg-black/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="text-white/40 font-mono text-[13px] flex items-center gap-2 hover:text-white transition-colors duration-200 cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> BACK
        </button>

        <div className="flex items-center gap-4">
          <a
            href="https://www.bandlab.com/stoy109"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.08em] border border-white/15 rounded px-3 py-1.5 text-white/60 hover:text-white hover:border-white/35 transition-colors duration-200 flex items-center gap-1.5"
          >
            BandLab <ExternalLink size={12} strokeWidth={1.5} />
          </a>

          <div className="flex items-center gap-2.5 text-white/25 font-mono text-[11px]">
            <div className="border border-white/15 rounded px-2.5 py-1 text-[11px] bg-white/[0.02] flex items-center gap-1">
              <Space size={12} />
            </div>
            <span>PLAY / PAUSE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
