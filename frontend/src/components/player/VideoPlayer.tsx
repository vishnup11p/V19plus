import { useRef, useEffect, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerControls } from './PlayerControls';
import { SubtitleOverlay } from './SubtitleOverlay';
import { NextEpisodeOverlay } from './NextEpisodeOverlay';
import { Content } from '../../api/content';
import { getPlaybackPrefs } from '../../pages/Settings';

interface VideoPlayerProps {
  content: Content;
  episodeId?: string;
  onNextEpisode?: () => void;
  initialResumeSeconds?: number;
}

export function VideoPlayer({ content, episodeId, onNextEpisode, initialResumeSeconds = 0 }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const hasSeeked = useRef(false);
  const [duration, setDuration] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);

  const {
    isPlaying, progress, volume, isMuted, showControls, subtitles, playbackSpeed,
    play, pause, resume, seek, setShowControls, updateProgress, saveProgressNow,
  } = usePlayerStore();

  const episode = content.seasons
    ?.flatMap((s) => s.episodes)
    .find((e) => e.id === episodeId);

  const videoUrl = episode?.videoUrl || content.videoUrl || '';
  const totalDuration = episode?.duration ? episode.duration * 60 : (content.duration || 0) * 60;
  const nextEpisode = content.seasons?.flatMap((s) => s.episodes).find((_, i, arr) => {
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
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        playbackRate={playbackSpeed}
        width="100%"
        height="100%"
        config={{ file: { attributes: { crossOrigin: 'anonymous' } } }}
        onProgress={({ playedSeconds }) => {
          updateProgress(playedSeconds);
          // T1-9: Skip intro detection
          if (episode?.introStart !== undefined && episode?.introEnd !== undefined) {
            const inIntro = playedSeconds >= episode.introStart && playedSeconds < episode.introEnd;
            setShowSkipIntro(inIntro);
          }
        }}
        onDuration={(d) => setDuration(d)}
        onEnded={handleEnded}
        onPause={saveProgressNow}
        progressInterval={1000}
      />

      <SubtitleOverlay visible={subtitles} text="[Subtitles would appear here in production]" />

      {/* T1-9: Skip Intro button */}
      {showSkipIntro && episode?.introEnd && (
        <div className="absolute bottom-28 right-6 z-20">
          <button
            onClick={() => {
              seek(episode.introEnd!);
              playerRef.current?.seekTo(episode.introEnd!);
              setShowSkipIntro(false);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-black/70 backdrop-blur-sm border-2 border-white text-white font-bold text-sm rounded hover:bg-white hover:text-black transition-all duration-200"
          >
            Skip Intro
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

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
