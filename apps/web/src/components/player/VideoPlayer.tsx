import { useRef, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerControls } from './PlayerControls';
import { SubtitleOverlay } from './SubtitleOverlay';
import { NextEpisodeOverlay } from './NextEpisodeOverlay';
import { Content } from '../../api/content';
import { getPlaybackPrefs } from '../../utils/playbackPrefs';
import { useDownloadStore } from '../../store/downloadStore';
import { historyApi } from '../../api/history';
import { Capacitor } from '@capacitor/core';
import Hls from 'hls.js';

interface VideoPlayerProps {
  content: Content;
  episodeId?: string;
  onNextEpisode?: () => void;
  initialResumeSeconds?: number;
  autoPlay?: boolean;
}

export function VideoPlayer({
  content,
  episodeId,
  onNextEpisode,
  initialResumeSeconds = 0,
  autoPlay = true,
}: VideoPlayerProps) {
  const router = useRouter();

  // Unique instance ID for debugging and complete multi-player isolation
  const instanceId = useRef('player_' + Math.random().toString(36).substring(2, 9)).current;

  // Instance-scoped refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<any>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSeeked = useRef(false);
  const isHovered = useRef(false);
  const isManualQualityRef = useRef(false);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(initialResumeSeconds);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(() => getPlaybackPrefs().defaultSpeed);
  const [subtitles, setSubtitles] = useState(() => getPlaybackPrefs().subtitles);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualities, setQualities] = useState<Array<{ height: number; bitrate?: number; index: number; label?: string; url?: string }>>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto ABR
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Central instrumentation logger
  const logEvent = useCallback((event: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[Player #${instanceId} @ ${timestamp}] ${event}`, details !== undefined ? details : '');
  }, [instanceId]);

  const allEpisodes = content.seasons?.flatMap((s) => s.episodes) || [];
  const episode = (episodeId ? allEpisodes.find((e) => e.id === episodeId) : null) || allEpisodes[0];

  const bunnyGuid = (episode as any)?.bunnyVideoGuid || (content as any)?.bunnyVideoGuid;
  const cdnHost = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BUNNY_CDN_HOST) || 'vz-5385b21b-c9e.b-cdn.net';
  const bunnyHlsUrl = bunnyGuid ? `https://${cdnHost}/${bunnyGuid}/playlist.m3u8` : '';

  const storedHls = (episode?.hlsUrl || content.hlsUrl || '').trim();
  const storedUrl = (episode?.videoUrl || content.videoUrl || '').trim();

  // ALWAYS prioritize verified BunnyCDN adaptive HLS stream
  let resolvedUrl = '';
  if (bunnyHlsUrl) {
    resolvedUrl = bunnyHlsUrl;
  } else if (storedHls && (storedHls.includes('b-cdn.net') || storedHls.includes('.m3u8'))) {
    resolvedUrl = storedHls;
  } else if (storedUrl && (storedUrl.includes('b-cdn.net') || storedUrl.includes('.m3u8'))) {
    resolvedUrl = storedUrl;
  } else {
    resolvedUrl = storedHls || storedUrl;
  }

  const { downloads } = useDownloadStore();
  const downloadItem = downloads[episode?.id || episodeId || content.id];
  const finalVideoUrl = (downloadItem && downloadItem.status === 'completed' && downloadItem.localUri)
    ? (typeof (Capacitor as any)?.convertFileSrc === 'function' && Capacitor.isNativePlatform()
        ? (Capacitor as any).convertFileSrc(downloadItem.localUri)
        : downloadItem.localUri)
    : resolvedUrl;

  const totalDuration = episode?.duration ? episode.duration * 60 : (content.duration || 0) * 60;
  const nextEpisode = allEpisodes.find((e, i, arr) => {
    const activeId = episode?.id || episodeId;
    const idx = arr.findIndex((ep) => ep.id === activeId);
    return idx >= 0 && i === idx + 1;
  });

  const hasVideo = finalVideoUrl.length > 0;

  // Toggle play/pause safely with browser promise handling
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        logEvent('play', { origin: 'user_toggle' });
      }).catch((err) => {
        console.warn('[VideoPlayer] Play interrupted:', err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      logEvent('pause', { origin: 'user_toggle' });
    }
  }, [logEvent]);

  // Instance-scoped history saving
  const saveProgressNow = useCallback((sec?: number) => {
    const currentSec = sec !== undefined ? sec : progress;
    if (!content?.id || currentSec <= 0) return;
    const total = totalDuration > 0 ? totalDuration : 1;
    const pct = Math.min(100, (currentSec / total) * 100);

    historyApi.upsert({
      contentId: content.id,
      episodeId: episode?.id || episodeId,
      progress: pct,
      completed: pct >= 95,
    }).catch(() => {});
  }, [content?.id, episode?.id, episodeId, progress, totalDuration]);

  const triggerPeriodicSave = useCallback((sec: number) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveProgressNow(sec);
    }, 8000);
  }, [saveProgressNow]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveProgressNow();
    };
  }, [saveProgressNow]);

  // Native landscape lock & keep-awake
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

  // Initialize Native HTML5 Video + HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !finalVideoUrl) return;

    hasSeeked.current = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = finalVideoUrl.includes('.m3u8') || finalVideoUrl.includes('b-cdn.net');

    logEvent('initPlayer', { url: finalVideoUrl, isHls });

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferSize: 60 * 1000 * 1000,
        startLevel: -1,
        autoStartLoad: true,
        capLevelToPlayerSize: false,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(finalVideoUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        logEvent('manifestParsed', { levels: data.levels?.length });
        if (data.levels && data.levels.length > 0) {
          const getLabel = (height: number) => {
            if (height >= 1080) return `${height}p Full HD`;
            if (height >= 720) return `${height}p HD`;
            if (height >= 480) return `${height}p Standard`;
            if (height >= 360) return `${height}p Medium`;
            if (height >= 240) return `${height}p Low Data (Smooth)`;
            return `${height}p Ultra Low`;
          };
          const parsed = data.levels.map((l: any, i: number) => ({
            height: l.height || 0,
            bitrate: l.bitrate || 0,
            index: i,
            label: getLabel(l.height),
          })).sort((a: any, b: any) => b.height - a.height);
          setQualities(parsed);
        }

        if (initialResumeSeconds > 0 && !hasSeeked.current) {
          video.currentTime = initialResumeSeconds;
          hasSeeked.current = true;
        }

        if (autoPlay) {
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.log('[VideoPlayer] Autoplay prevented by browser, waiting for user tap:', err);
            setIsPlaying(false);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        logEvent('hlsError', { type: data.type, details: data.details, fatal: data.fatal });
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              logEvent('hlsRecoverNetwork');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              logEvent('hlsRecoverMedia');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setIsError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari on iOS / Mac)
      video.src = finalVideoUrl;
      if (initialResumeSeconds > 0 && !hasSeeked.current) {
        video.currentTime = initialResumeSeconds;
        hasSeeked.current = true;
      }
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      // Direct file fallback
      video.src = finalVideoUrl;
      if (initialResumeSeconds > 0 && !hasSeeked.current) {
        video.currentTime = initialResumeSeconds;
        hasSeeked.current = true;
      }
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [finalVideoUrl, autoPlay, initialResumeSeconds, logEvent]);

  // Sync volume, mute, and speed changes to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isPlayerActive = isHovered.current ||
        containerRef.current?.contains(document.activeElement) ||
        document.fullscreenElement === containerRef.current;

      if (!isPlayerActive) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            const next = Math.max(0, videoRef.current.currentTime - 10);
            videoRef.current.currentTime = next;
            setProgress(next);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            const next = Math.min(duration, videoRef.current.currentTime + 10);
            videoRef.current.currentTime = next;
            setProgress(next);
          }
          break;
        case 'f':
        case 'F':
          handleToggleFullscreen();
          break;
        case 'm':
        case 'M':
          setIsMuted((prev) => !prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.1));
          break;
      }
      resetHideTimer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [duration, handleToggleFullscreen, resetHideTimer, togglePlay]);

  const handleSeek = (time: number) => {
    logEvent('seek', { time });
    setProgress(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleEnded = () => {
    logEvent('ended');
    saveProgressNow(duration);
    const prefs = getPlaybackPrefs();
    if (onNextEpisode && prefs.autoplayNext) {
      setShowNextOverlay(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePiP = async () => {
    const video = videoRef.current;
    if (video && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } catch { /* ignore */ }
    }
  };

  const handleSetVolume = (v: number) => {
    setVolume(v);
    setIsMuted(v === 0);
  };

  const handleSetQuality = (qualityIndex: number) => {
    logEvent('qualitySelect', { qualityIndex, isManual: qualityIndex >= 0 });
    setCurrentQuality(qualityIndex);

    if (hlsRef.current) {
      if (qualityIndex === -1) {
        isManualQualityRef.current = false;
        hlsRef.current.currentLevel = -1;
      } else {
        isManualQualityRef.current = true;
        hlsRef.current.currentLevel = qualityIndex;
        hlsRef.current.loadLevel = qualityIndex;
      }
    }
  };

  if (!hasVideo || isError) {
    const errorTitle = isError ? "Playback Error" : "Content Unavailable";
    const errorMsg = isError 
      ? "We encountered a playback error loading this video stream. Please check your connection and try again."
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
          <div className="flex gap-3 mt-2">
            {isError && (
              <button
                onClick={() => {
                  setIsError(false);
                  setIsBuffering(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="px-6 py-2.5 bg-n-red hover:bg-n-red-hover text-white font-bold rounded-md text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
              >
                Retry Playback
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-[#2a2a2a] hover:bg-[#333] text-white font-bold rounded-md text-sm transition-all active:scale-95"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showNextBtn = totalDuration > 0 && progress / totalDuration > 0.9 && !!onNextEpisode;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden select-none ${showControls ? 'cursor-default' : 'cursor-none'}`}
      onMouseMove={resetHideTimer}
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
      onClick={() => {
        resetHideTimer();
      }}
    >
      {/* Top Bar with Back Button */}
      {showControls && (
        <div
          className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent animate-fade-in pointer-events-auto"
          style={{ willChange: 'opacity, transform' }}
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

      {/* Native HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        className="w-full h-full object-contain cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onPlay={() => {
          setIsBuffering(false);
          setIsPlaying(true);
          logEvent('play', { progress });
        }}
        onPause={() => {
          setIsPlaying(false);
          logEvent('pause', { progress });
          saveProgressNow(progress);
        }}
        onTimeUpdate={() => {
          if (videoRef.current) {
            const cur = videoRef.current.currentTime;
            setProgress(cur);
            triggerPeriodicSave(cur);
          }
        }}
        onDurationChange={() => {
          if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            setDuration(videoRef.current.duration);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            setDuration(videoRef.current.duration);
          }
        }}
        onWaiting={() => {
          logEvent('waiting');
          setIsBuffering(true);
        }}
        onPlaying={() => {
          logEvent('playing');
          setIsBuffering(false);
        }}
        onCanPlay={() => {
          setIsBuffering(false);
        }}
        onEnded={handleEnded}
        onError={(e) => {
          console.warn('[VideoPlayer] Native video error event:', e);
        }}
      />

      <SubtitleOverlay visible={false} text="" />

      {/* Center Play Button when paused / waiting for user interaction */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-auto cursor-pointer bg-black/40 backdrop-blur-[2px]"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          <div className="w-20 h-20 rounded-full bg-[#FF5C00] hover:bg-[#FF7A00] flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,92,0,0.6)] transition-all hover:scale-110 active:scale-95">
            <svg className="w-9 h-9 fill-white ml-1" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Subtle Buffering Spinner (Only when actively playing and stalling) */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="w-14 h-14 border-4 border-white/20 border-t-[#FF5C00] rounded-full animate-spin"></div>
        </div>
      )}

      {showNextOverlay && onNextEpisode && (
        <NextEpisodeOverlay
          title={nextEpisode?.title}
          onNext={() => { setShowNextOverlay(false); onNextEpisode(); }}
          onCancel={() => { setShowNextOverlay(false); setIsPlaying(false); }}
        />
      )}

      <PlayerControls
        duration={duration || totalDuration}
        onSeek={handleSeek}
        onNextEpisode={onNextEpisode}
        showNext={showNextBtn}
        onPiP={handlePiP}
        isPlaying={isPlaying}
        progress={progress}
        volume={volume}
        isMuted={isMuted}
        showControls={showControls}
        playbackSpeed={playbackSpeed}
        subtitles={subtitles}
        isFullscreen={isFullscreen}
        qualities={qualities}
        currentQuality={currentQuality}
        onTogglePlay={togglePlay}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleSubtitles={() => setSubtitles((prev) => !prev)}
        onSetPlaybackSpeed={(s) => setPlaybackSpeed(s)}
        onSetVolume={handleSetVolume}
        onSetQuality={handleSetQuality}
      />

      {!showControls && (
        <div className="absolute top-4 left-4 text-white/50 text-sm pointer-events-none">
          {content.title}{episode ? ` — ${episode.title}` : ''}
        </div>
      )}
    </div>
  );
}
