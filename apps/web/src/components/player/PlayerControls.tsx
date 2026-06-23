import { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface PlayerControlsProps {
  duration: number;
  onSeek: (time: number) => void;
  onNextEpisode?: () => void;
  showNext?: boolean;
  onPiP?: () => void;
}

export function PlayerControls({ duration, onSeek, onNextEpisode, showNext, onPiP }: PlayerControlsProps) {
  const {
    isPlaying, progress, volume, isMuted, showControls, playbackSpeed, subtitles,
    pause, resume, toggleMute, toggleFullscreen, toggleSubtitles,
    setPlaybackSpeed, setVolume,
  } = usePlayerStore();

  const [showSettings, setShowSettings] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  // Close settings on outside click
  useEffect(() => {
    const handler = () => setShowSettings(false);
    if (showSettings) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showSettings]);

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    setHoverTime(pct * duration);
    setHoverX(e.clientX);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    onSeek(pct * duration);
  };

  if (!showControls) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      <div className="relative px-6 pb-5 pt-12">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1 bg-white/25 rounded-full mb-4 cursor-pointer group/progress"
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onClick={handleProgressClick}
        >
          {/* Filled */}
          <div
            className="absolute left-0 top-0 h-full bg-n-red rounded-full transition-none"
            style={{ width: `${pct}%` }}
          />
          {/* Scrubber dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-n-red rounded-full -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-md"
            style={{ left: `${pct}%` }}
          />
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
              style={{ left: `${(hoverTime / duration) * 100}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Play/Pause */}
            <button
              onClick={() => isPlaying ? pause() : resume()}
              className="text-white hover:text-n-red transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip back 10s */}
            <button
              onClick={() => onSeek(Math.max(0, progress - 10))}
              className="text-white hover:text-n-red transition-colors hidden sm:block"
              aria-label="Rewind 10s"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Skip forward 10s */}
            <button
              onClick={() => onSeek(Math.min(duration, progress + 10))}
              className="text-white hover:text-n-red transition-colors hidden sm:block"
              aria-label="Forward 10s"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-n-red transition-colors" aria-label="Mute">
                {isMuted || volume === 0 ? (
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <div className="hidden sm:block w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1"
                  style={{ accentColor: '#E50914' }}
                />
              </div>
            </div>
 
            {/* Time */}
            <span className="text-sm text-white/70 font-mono hidden sm:inline-block">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
 
          {/* Skip Intro Button */}
          {progress > 10 && progress < 85 && duration > 150 && (
            <button
              onClick={() => onSeek(85)}
              className="absolute right-6 -top-12 z-30 px-6 py-2.5 bg-black/60 border border-white/20 hover:border-n-red hover:bg-black text-white text-sm font-black rounded-lg backdrop-blur-md transition-all active:scale-95 shadow-lg shadow-black/40 hover:shadow-red-500/10 flex items-center gap-1.5"
            >
              Skip Intro
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Next episode */}
            {showNext && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 border border-white/50 text-white rounded hover:bg-white/10 transition-colors"
              >
                Next
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            )}

            {/* Subtitles */}
            <button
              onClick={toggleSubtitles}
              className={`text-xs font-bold px-2 py-1 rounded border transition-colors ${
                subtitles ? 'bg-n-white text-black border-n-white' : 'text-white/70 border-white/30 hover:border-white/60'
              }`}
              aria-label="Subtitles"
            >
              CC
            </button>

            {/* Settings (Speed & Quality) */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className={`transition-colors ${showSettings ? 'text-white' : 'text-white/70 hover:text-white'}`}
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {showSettings && (
                <div
                  className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/10 rounded-lg overflow-hidden w-48 flex"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 border-r border-white/10">
                    <p className="text-xs text-white/50 px-3 py-2 border-b border-white/10">Speed</p>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setPlaybackSpeed(s); setShowSettings(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          playbackSpeed === s ? 'text-n-red' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {s === 1 ? 'Normal' : `${s}×`}
                      </button>
                    ))}
                  </div>

                  {usePlayerStore.getState().qualities.length > 0 && (
                    <div className="flex-1">
                      <p className="text-xs text-white/50 px-3 py-2 border-b border-white/10">Quality</p>
                      <button
                        onClick={() => { usePlayerStore.getState().setQuality(-1); setShowSettings(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          usePlayerStore.getState().currentQuality === -1 ? 'text-n-red' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        Auto
                      </button>
                      {usePlayerStore.getState().qualities.map((q) => (
                        <button
                          key={q.index}
                          onClick={() => { usePlayerStore.getState().setQuality(q.index); setShowSettings(false); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            usePlayerStore.getState().currentQuality === q.index ? 'text-n-red' : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {q.height}p
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PiP */}
            {onPiP && (
              <button
                onClick={onPiP}
                className="text-white/70 hover:text-white transition-colors hidden md:block"
                aria-label="Picture in Picture"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 8H4V4m0 0l6 6M4 4l6 6M20 16h-6v4m0 0l6-6m-6 6l6-6" />
                </svg>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
