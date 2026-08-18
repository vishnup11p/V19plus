import { useRef, useEffect, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerControls } from './PlayerControls';
import { SubtitleOverlay } from './SubtitleOverlay';
import { NextEpisodeOverlay } from './NextEpisodeOverlay';
import { Content } from '../../api/content';
import { getPlaybackPrefs } from '../../utils/playbackPrefs';
import { useDownloadStore } from '../../store/downloadStore';
import { Capacitor } from '@capacitor/core';

interface VideoPlayerProps {
  content: Content;
  episodeId?: string;
  onNextEpisode?: () => void;
  initialResumeSeconds?: number;
}

export function VideoPlayer({ content, episodeId, onNextEpisode, initialResumeSeconds = 0 }: VideoPlayerProps) {
  const router = useRouter();
  const playerRef = useRef<ReactPlayer>(null);
  const hlsPlayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const hasSeeked = useRef(false);
  const [duration, setDuration] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const {
    isPlaying, progress, volume, isMuted, showControls, subtitles, playbackSpeed,
    play, pause, resume, seek, setShowControls, updateProgress, saveProgressNow,
  } = usePlayerStore();

  const episode = content.seasons
    ?.flatMap((s) => s.episodes)
    .find((e) => e.id === episodeId);

  const videoUrl = episode?.videoUrl || content.videoUrl || '';
  const { downloads } = useDownloadStore();
  const downloadItem = downloads[episodeId || content.id];
  const finalVideoUrl = (downloadItem && downloadItem.status === 'completed' && downloadItem.localUri)
    ? (Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(downloadItem.localUri) : downloadItem.localUri)
    : videoUrl;

  const totalDuration = episode?.duration ? episode.duration * 60 : (content.duration || 0) * 60;
  const nextEpisode = content.seasons?.flatMap((s) => s.episodes).find((e, i, arr) => {
    const idx = arr.findIndex((ep) => ep.id === episodeId);
    return idx >= 0 && i === idx + 1;
  });

  const hasVideo = !!finalVideoUrl && (finalVideoUrl.startsWith('http://') || finalVideoUrl.startsWith('https://') || finalVideoUrl.startsWith('/') || finalVideoUrl.startsWith('file://') || finalVideoUrl.startsWith('capacitor://'));

  // Native orientation lock and keep awake hooks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const enableNativeFeatures = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { ScreenOrientation } = await import('@capacitor/screen-orientation');
        if (!isMounted) return;
        await ScreenOrientation.lock({ orientation: 'landscape' });

        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        if (!isMounted) {
          await ScreenOrientation.unlock();
          return;
        }
        await KeepAwake.keepAwake();

        if (!isMounted) {
          await KeepAwake.allowSleep();
          await ScreenOrientation.unlock();
        }
      } catch (err) {
        console.error('Failed to enable native video player locks:', err);
      }
    };

    enableNativeFeatures();

    return () => {
      isMounted = false;
      const disableNativeFeatures = async () => {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (!Capacitor.isNativePlatform()) return;

          const { ScreenOrientation } = await import('@capacitor/screen-orientation');
          await ScreenOrientation.unlock();

          const { KeepAwake } = await import('@capacitor-community/keep-awake');
          await KeepAwake.allowSleep();
        } catch (err) {
          console.error('Failed to disable native video player locks:', err);
        }
      };
      disableNativeFeatures();
    };
  }, []);

  // Subscribe to playerStore changes for HLS quality settings
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      if (hlsPlayerRef.current && hlsPlayerRef.current.currentLevel !== state.currentQuality) {
        hlsPlayerRef.current.currentLevel = state.currentQuality;
      }
    });
    return () => {
      unsubscribe();
      hlsPlayerRef.current = null;
    };
  }, []);

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

  if (!hasVideo || isError) {
    const errorTitle = isError ? "Playback Error" : "Content Unavailable";
    const errorMsg = isError 
      ? "We encountered an error playing this video. Please try again later."
      : "We're sorry, but this content is currently not streaming in your region or the video file is missing.";

    return (
      <div className="relative w-full h-screen bg-[#141414] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="absolute top-6 left-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-n-red transition-colors active:scale-90"
            aria-label="Go Back"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
        <div className="max-w-md p-8 bg-[#181818] border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white">{errorTitle}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {errorMsg}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-6 py-2.5 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-md text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const showNextBtn = totalDuration > 0 && progress / totalDuration > 0.9 && !!onNextEpisode;

  const activeSubtitles = episode?.subtitles || content.subtitles || [];
  const tracks = activeSubtitles.map((sub) => ({
    kind: 'subtitles',
    src: sub.url,
    srcLang: sub.language,
    label: sub.label,
    default: sub.language === 'en',
  }));
  const activeTracks = subtitles ? tracks : [];

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
        url={finalVideoUrl}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        playbackRate={playbackSpeed}
        width="100%"
        height="100%"
        config={{
          file: {
            forceHLS: finalVideoUrl.endsWith('.m3u8'),
            attributes: { crossOrigin: 'anonymous' },
            tracks: activeTracks,
          }
        }}
        onReady={(player) => {
          const internalPlayer = player.getInternalPlayer('hls');
          if (internalPlayer) {
            hlsPlayerRef.current = internalPlayer;
            // It's an Hls.js instance
            internalPlayer.on('hlsManifestParsed', (event: any, data: any) => {
              if (data.levels) {
                const levels = data.levels.map((l: any, i: number) => ({
                  height: l.height,
                  bitrate: l.bitrate,
                  index: i,
                })).sort((a: any, b: any) => b.height - a.height); // sort descending
                usePlayerStore.getState().setQualities(levels);
              }
            });
          }
        }}
        onProgress={({ playedSeconds }) => updateProgress(playedSeconds)}
        onDuration={(d) => setDuration(d)}
        onEnded={handleEnded}
        onPause={saveProgressNow}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onError={() => setIsError(true)}
        progressInterval={1000}
      />

      <SubtitleOverlay visible={false} text="" />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none">
          <div className="w-16 h-16 border-4 border-n-red border-t-transparent rounded-full animate-spin"></div>
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
