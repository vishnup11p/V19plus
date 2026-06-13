import { useRef, useEffect, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerControls } from './PlayerControls';
import { SubtitleOverlay } from './SubtitleOverlay';
import { NextEpisodeOverlay } from './NextEpisodeOverlay';
import { Content } from '../../api/content';
import { getPlaybackPrefs } from '../../utils/playbackPrefs';

interface VideoPlayerProps {
  content: Content;
  episodeId?: string;
  onNextEpisode?: () => void;
  initialResumeSeconds?: number;
}

export function VideoPlayer({ content, episodeId, onNextEpisode, initialResumeSeconds = 0 }: VideoPlayerProps) {
  const router = useRouter();
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const hasSeeked = useRef(false);
  const [duration, setDuration] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);

  const {
    isPlaying, progress, volume, isMuted, showControls, subtitles, playbackSpeed,
    play, pause, resume, seek, setShowControls, updateProgress, saveProgressNow,
  } = usePlayerStore();

  const episode = content.seasons
    ?.flatMap((s) => s.episodes)
    .find((e) => e.id === episodeId);

  const videoUrl = episode?.videoUrl || content.videoUrl || '';
  const totalDuration = episode?.duration ? episode.duration * 60 : (content.duration || 0) * 60;
  const nextEpisode = content.seasons?.flatMap((s) => s.episodes).find((e, i, arr) => {
    const idx = arr.findIndex((ep) => ep.id === episodeId);
    return idx >= 0 && i === idx + 1;
  });

  useEffect(() => {
    play(content, episode ? { ...episode, duration: episode.duration } : undefined, initialResumeSeconds);
    hasSeeked.current = false;
    return () => usePlayerStore.getState().reset();
  }, [content.id, episodeId, initialResumeSeconds]);

  useEffect(() => {
    if (initialResumeSeconds > 0 && duration > 0 && !hasSeeked.current) {
      playerRef.current?.seekTo(initialResumeSeconds);
      seek(initialResumeSeconds);
      hasSeeked.current = true;
    }
  }, [duration, initialResumeSeconds, seek]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [setShowControls]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? pause() : resume();
          break;
        case 'ArrowLeft':
          seek(Math.max(0, progress - 10));
          playerRef.current?.seekTo(Math.max(0, progress - 10));
          break;
        case 'ArrowRight':
          seek(Math.min(duration, progress + 10));
          playerRef.current?.seekTo(Math.min(duration, progress + 10));
          break;
        case 'f':
        case 'F':
          usePlayerStore.getState().toggleFullscreen();
          break;
        case 'm':
        case 'M':
          usePlayerStore.getState().toggleMute();
          break;
        case 'ArrowUp':
          usePlayerStore.getState().setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          usePlayerStore.getState().setVolume(Math.max(0, volume - 0.1));
          break;
      }
      resetHideTimer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, progress, duration, volume, pause, resume, seek, resetHideTimer]);

  const handleSeek = (time: number) => {
    seek(time);
    playerRef.current?.seekTo(time);
  };

  const handleEnded = () => {
    saveProgressNow();
    const prefs = getPlaybackPrefs();
    if (onNextEpisode && prefs.autoplayNext) {
      setShowNextOverlay(true);
    } else {
      pause();
    }
  };

  const handlePiP = async () => {
    const video = containerRef.current?.querySelector('video');
    if (video && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } catch { /* ignore */ }
    }
  };

  const showNextBtn = totalDuration > 0 && progress / totalDuration > 0.9 && !!onNextEpisode;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black cursor-none group"
      onMouseMove={resetHideTimer}
      onClick={() => (isPlaying ? pause() : resume())}
    >
      {/* Top Bar with Back Button */}
      {showControls && (
        <div
          className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => router.back()}
            className="text-white hover:text-n-red transition-colors active:scale-90"
            aria-label="Go Back"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col text-left">
            <span className="text-white font-bold text-lg md:text-xl leading-tight text-shadow">
              {content.title}
            </span>
            {episode && (
              <span className="text-white/60 text-xs md:text-sm text-shadow-sm">
                S{content.seasons?.find((s) => s.episodes.some((e) => e.id === episodeId))?.number || 1}:E{episode.number} — {episode.title}
              </span>
            )}
          </div>
        </div>
      )}

      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        playbackRate={playbackSpeed}
        width="100%"
        height="100%"
        config={{ file: { attributes: { crossOrigin: 'anonymous' } } }}
        onProgress={({ playedSeconds }) => updateProgress(playedSeconds)}
        onDuration={(d) => setDuration(d)}
        onEnded={handleEnded}
        onPause={saveProgressNow}
        progressInterval={1000}
      />

      <SubtitleOverlay visible={subtitles} text="[Subtitles would appear here in production]" />

      {showNextOverlay && onNextEpisode && (
        <NextEpisodeOverlay
          title={nextEpisode?.title}
          onNext={() => { setShowNextOverlay(false); onNextEpisode(); }}
          onCancel={() => { setShowNextOverlay(false); pause(); }}
        />
      )}

      <PlayerControls
        duration={duration || totalDuration}
        onSeek={handleSeek}
        onNextEpisode={onNextEpisode}
        showNext={showNextBtn}
        onPiP={handlePiP}
      />

      {!showControls && (
        <div className="absolute top-4 left-4 text-white/50 text-sm pointer-events-none">
          {content.title}{episode ? ` — ${episode.title}` : ''}
        </div>
      )}
    </div>
  );
}
