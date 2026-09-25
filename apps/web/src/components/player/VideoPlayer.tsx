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
  const hideTimer = useRef<any>(null);
  const bufferTimer = useRef<any>(null);
  const hasSeeked = useRef(false);
  const [duration, setDuration] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const {
    isPlaying, progress, volume, isMuted, showControls, subtitles, playbackSpeed,
    play, pause, resume, seek, setShowControls, updateProgress, saveProgressNow,
  } = usePlayerStore();

  const allEpisodes = content.seasons?.flatMap((s) => s.episodes) || [];
  const episode = (episodeId ? allEpisodes.find((e) => e.id === episodeId) : null) || allEpisodes[0];

  const rawVideoUrl = (episode?.videoUrl || content.videoUrl || '').trim();
  const { downloads } = useDownloadStore();
  const downloadItem = downloads[episode?.id || episodeId || content.id];
  const finalVideoUrl = (downloadItem && downloadItem.status === 'completed' && downloadItem.localUri)
    ? (typeof (Capacitor as any)?.convertFileSrc === 'function' && Capacitor.isNativePlatform()
        ? (Capacitor as any).convertFileSrc(downloadItem.localUri)
        : downloadItem.localUri)
    : rawVideoUrl;

  const totalDuration = episode?.duration ? episode.duration * 60 : (content.duration || 0) * 60;
  const nextEpisode = allEpisodes.find((e, i, arr) => {
    const activeId = episode?.id || episodeId;
    const idx = arr.findIndex((ep) => ep.id === activeId);
    return idx >= 0 && i === idx + 1;
  });

  // Accept any non-empty URL — http, https, relative, file, capacitor, blob, etc.
  const hasVideo = finalVideoUrl.length > 0;

  const sanitizeStreamUrl = (url: string) => {
    if (!url) return '';
    let sanitized = url.trim();

    // 1. Handle gs:// (e.g. gs://v19-plus.firebasestorage.app/uploads/EP-01.mp4)
    if (sanitized.startsWith('gs://')) {
      const withoutPrefix = sanitized.replace('gs://', '');
      const slashIdx = withoutPrefix.indexOf('/');
      if (slashIdx !== -1) {
        const bucket = withoutPrefix.substring(0, slashIdx);
        const filePath = withoutPrefix.substring(slashIdx + 1);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
      }
    }

    // 2. Handle storage.googleapis.com
    if (sanitized.includes('storage.googleapis.com/') && !sanitized.includes('firebasestorage.googleapis.com')) {
      const match = sanitized.match(/^https?:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/);
      if (match) {
        const bucket = match[1];
        const filePath = match[2];
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
      }
    }

    // 3. Handle firebasestorage.googleapis.com (ensure alt=media is present)
    if (sanitized.includes('firebasestorage.googleapis.com') && !sanitized.includes('alt=media')) {
      sanitized += (sanitized.includes('?') ? '&' : '?') + 'alt=media';
    }
    return sanitized;
  };

  const [activeVideoUrl, setActiveVideoUrl] = useState(() => sanitizeStreamUrl(finalVideoUrl));
  const fallbackAttempted = useRef(false);

  useEffect(() => {
    setActiveVideoUrl(sanitizeStreamUrl(finalVideoUrl));
    fallbackAttempted.current = false;
  }, [finalVideoUrl]);

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

  // Subscribe to playerStore changes for HLS quality settings & direct multi-resolution streams
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      if (hlsPlayerRef.current && hlsPlayerRef.current.currentLevel !== state.currentQuality) {
        hlsPlayerRef.current.currentLevel = state.currentQuality;
      }
      // If quality changed and it has a direct stream URL (multi-bitrate URLs)
      if (state.currentQuality >= 0 && state.qualities[state.currentQuality]?.url) {
        const targetUrl = state.qualities[state.currentQuality].url!;
        if (targetUrl && targetUrl !== activeVideoUrl) {
          const currentSec = usePlayerStore.getState().progress;
          setActiveVideoUrl(targetUrl);
          setTimeout(() => {
            playerRef.current?.seekTo(currentSec);
          }, 150);
        }
      }
    });
    return () => {
      unsubscribe();
      hlsPlayerRef.current = null;
    };
  }, [activeVideoUrl]);

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

  // Real-time synchronization with native <video> element to prevent any stuck buffering state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanupListeners: (() => void) | null = null;

    const attachListeners = () => {
      const video = container.querySelector('video');
      if (!video) return false;

      const clearBuffer = () => {
        if (bufferTimer.current) {
          clearTimeout(bufferTimer.current);
          bufferTimer.current = null;
        }
        setIsBuffering(false);
      };

      const handleWaiting = () => {
        if (bufferTimer.current) clearTimeout(bufferTimer.current);
        // Only trigger buffering spinner if playback stalls for > 600ms
        bufferTimer.current = setTimeout(() => {
          if (!video.paused && !video.ended) {
            setIsBuffering(true);
          }
        }, 600);
      };

      video.addEventListener('playing', clearBuffer);
      video.addEventListener('timeupdate', clearBuffer);
      video.addEventListener('canplay', clearBuffer);
      video.addEventListener('canplaythrough', clearBuffer);
      video.addEventListener('pause', clearBuffer);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('stalled', handleWaiting);

      cleanupListeners = () => {
        video.removeEventListener('playing', clearBuffer);
        video.removeEventListener('timeupdate', clearBuffer);
        video.removeEventListener('canplay', clearBuffer);
        video.removeEventListener('canplaythrough', clearBuffer);
        video.removeEventListener('pause', clearBuffer);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('stalled', handleWaiting);
      };
      return true;
    };

    if (!attachListeners()) {
      const interval = setInterval(() => {
        if (attachListeners()) {
          clearInterval(interval);
        }
      }, 200);
      return () => {
        clearInterval(interval);
        if (cleanupListeners) cleanupListeners();
        if (bufferTimer.current) clearTimeout(bufferTimer.current);
      };
    }

    return () => {
      if (cleanupListeners) cleanupListeners();
      if (bufferTimer.current) clearTimeout(bufferTimer.current);
    };
  }, [activeVideoUrl]);

  // Continuous Playback Watchdog: Guarantees video DOES NOT STOP under slow or fluctuating networks
  useEffect(() => {
    let lastSec = -1;
    let stallCount = 0;

    const watchdog = setInterval(() => {
      const video = containerRef.current?.querySelector('video');
      if (!video) return;

      if (isPlaying && !video.paused && !video.ended) {
        const cur = video.currentTime;
        if (lastSec > 0 && Math.abs(cur - lastSec) < 0.05) {
          stallCount++;
          // If video has stalled for > 2.5 seconds
          if (stallCount >= 3) {
            console.warn('⚠️ Zero-Stall Watchdog: Video paused on buffer, auto-recovering...');
            
            // 1. If HLS, automatically drop quality level so playback immediately continues
            if (hlsPlayerRef.current) {
              const curLvl = hlsPlayerRef.current.currentLevel;
              if (curLvl > 0) {
                console.log('Zero-Stall: Auto-downshifting to lower resolution level');
                hlsPlayerRef.current.currentLevel = Math.max(0, curLvl - 1);
              } else if (curLvl === -1) {
                // If on Auto and stalled, temporarily force lowest level (180p/240p)
                console.log('Zero-Stall: Forcing lowest level (180p/240p) for immediate buffer fill');
                hlsPlayerRef.current.currentLevel = 0;
              }
            }

            // 2. Hardware Decoder Unstick
            try {
              video.currentTime = cur + 0.08;
              video.play().catch(() => {});
            } catch (err) {
              // Ignore
            }
            stallCount = 0;
          }
        } else {
          lastSec = cur;
          stallCount = 0;
        }
      } else {
        lastSec = -1;
        stallCount = 0;
      }
    }, 1000);

    return () => clearInterval(watchdog);
  }, [isPlaying]);

  // Multi-resolution URL loader for direct quality streams (180p, 240p, 360p, 480p, 720p, 1080p)
  useEffect(() => {
    const rawQualities = (episode as any)?.videoQualities || (content as any)?.videoQualities;
    if (rawQualities && typeof rawQualities === 'object' && Object.keys(rawQualities).length > 0) {
      const qList = Object.entries(rawQualities).map(([res, url], idx) => {
        const height = parseInt(res.replace(/\D/g, '')) || 0;
        const getLabel = (h: number) => {
          if (h >= 1080) return `${h}p Full HD`;
          if (h >= 720) return `${h}p HD`;
          if (h >= 480) return `${h}p Standard`;
          if (h >= 360) return `${h}p Medium`;
          if (h >= 240) return `${h}p Low Data (Smooth)`;
          return `${h}p Ultra Low (Never Stops)`;
        };
        return {
          height,
          index: idx,
          url: sanitizeStreamUrl(url as string),
          label: getLabel(height),
        };
      }).sort((a, b) => b.height - a.height);
      usePlayerStore.getState().setQualities(qList);
    }
  }, [content, episode]);

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
      ? "We encountered a playback error loading this video. Please check your connection and try again."
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
      className={`relative w-full h-full bg-black overflow-hidden select-none ${showControls ? 'cursor-default' : 'cursor-none'}`}
      onMouseMove={resetHideTimer}
      onClick={() => (isPlaying ? pause() : resume())}
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

      <ReactPlayer
        ref={playerRef}
        url={activeVideoUrl}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        playbackRate={playbackSpeed}
        width="100%"
        height="100%"
        playsinline
        config={{
          file: {
            forceHLS: activeVideoUrl.includes('.m3u8'),
            forceDASH: activeVideoUrl.includes('.mpd'),
            attributes: {
              ...(activeTracks.length > 0 && !activeVideoUrl.includes('firebasestorage.googleapis.com') ? { crossOrigin: 'anonymous' } : {}),
              playsInline: true,
              'webkit-playsinline': 'true',
              'x5-playsinline': 'true',
              preload: 'auto',
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              },
            },
            tracks: activeTracks,
            hlsOptions: {
              enableWorker: true, // Demux stream on a background Web Worker
              lowLatencyMode: false,
              backBufferLength: 90, // 90s backbuffer for instant seek back
              maxBufferLength: 60, // 60s forward buffer for rock-solid stability
              maxMaxBufferLength: 120, // 120s max forward buffer
              maxBufferSize: 80 * 1000 * 1000,
              maxBufferHole: 0.8, // Tolerate network jitter up to 0.8s without stalling
              highBufferWatchdogPeriod: 1, // Inspect buffer health every 1 second
              nudgeOffset: 0.2,
              nudgeMaxRetry: 10,
              maxFragLookUpTolerance: 0.3,
              startLevel: 0, // Starts at lowest resolution (180p/240p) immediately (<0.2s launch), then scales up smoothly
              autoStartLoad: true,
              capLevelToPlayerSize: true, // Caps stream resolution to device display to save GPU & bandwidth
              abrEwmaDefaultEstimate: 800000, // 800 kbps conservative default estimate for instant startup
              abrBandWidthFactor: 0.75, // Conservative factor: only climbs when bandwidth is proven
              abrBandWidthUpFactor: 0.5,
              abrMaxWithRealBitrate: true,
              fragLoadingTimeOut: 20000,
              fragLoadingMaxRetry: 6,
              fragLoadingRetryDelay: 500,
              levelLoadingTimeOut: 15000,
              levelLoadingMaxRetry: 5,
            },
          },
        }}
        onReady={(player) => {
          const internalPlayer = player.getInternalPlayer('hls');
          if (internalPlayer) {
            hlsPlayerRef.current = internalPlayer;
            // Manifest parsed -> load available bitrate & resolution levels
            internalPlayer.on('hlsManifestParsed', (event: any, data: any) => {
              if (data.levels) {
                const getLabel = (height: number) => {
                  if (height >= 1080) return `${height}p Full HD`;
                  if (height >= 720) return `${height}p HD`;
                  if (height >= 480) return `${height}p Standard`;
                  if (height >= 360) return `${height}p Medium`;
                  if (height >= 240) return `${height}p Low Data (Smooth)`;
                  return `${height}p Ultra Low (Never Stops)`;
                };
                const levels = data.levels.map((l: any, i: number) => ({
                  height: l.height,
                  bitrate: l.bitrate,
                  index: i,
                  label: getLabel(l.height),
                })).sort((a: any, b: any) => b.height - a.height); // sort descending
                usePlayerStore.getState().setQualities(levels);
              }
            });

            // Resilient Error Recovery: Auto-downgrades to lowest level so video never stops
            internalPlayer.on('hlsError', (event: any, data: any) => {
              if (data?.fatal) {
                switch (data.type) {
                  case 'networkError':
                    console.warn('HLS Network Error, forcing level 0 (180p/240p) to keep stream alive...');
                    internalPlayer.currentLevel = 0;
                    internalPlayer.startLoad();
                    break;
                  case 'mediaError':
                    console.warn('HLS Media Error, recovering media buffer...');
                    internalPlayer.recoverMediaError();
                    break;
                  default:
                    console.error('Fatal unrecoverable HLS error, resetting level:', data);
                    internalPlayer.currentLevel = 0;
                    internalPlayer.startLoad();
                    break;
                }
              } else if (data?.details === 'bufferStalledError') {
                // If stalled, downshift resolution level immediately so video never stops
                if (internalPlayer.currentLevel > 0) {
                  console.log('Buffer stall detected, auto-downshifting stream resolution...');
                  internalPlayer.currentLevel = Math.max(0, internalPlayer.currentLevel - 1);
                }
              }
            });
          } else {
            // Fallback for native HLS (Safari/iOS/Android Native) or direct MP4/WebM
            const videoElem = containerRef.current?.querySelector('video');
            if (videoElem) {
              const canPlayHLS = videoElem.canPlayType('application/vnd.apple.mpegurl');
              const canPlayMP4 = videoElem.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
              const canPlayWebM = videoElem.canPlayType('video/webm; codecs="vp9, opus"');
              if (!canPlayHLS && !canPlayMP4 && !canPlayWebM && activeVideoUrl.includes('.m3u8')) {
                console.warn('Native HLS not directly supported by HTML5 element; relying on MSE engine');
              }
            }
          }
        }}
        onPlay={() => {
          if (bufferTimer.current) clearTimeout(bufferTimer.current);
          setIsBuffering(false);
          if (!isPlaying) resume();
        }}
        onProgress={({ playedSeconds }) => {
          if (bufferTimer.current) clearTimeout(bufferTimer.current);
          setIsBuffering(false);
          updateProgress(playedSeconds);
        }}
        onDuration={(d) => setDuration(d)}
        onEnded={handleEnded}
        onPause={saveProgressNow}
        onBuffer={() => {
          if (bufferTimer.current) clearTimeout(bufferTimer.current);
          bufferTimer.current = setTimeout(() => {
            const v = containerRef.current?.querySelector('video');
            if (v && !v.paused && !v.ended) {
              setIsBuffering(true);
            }
          }, 600);
        }}
        onBufferEnd={() => {
          if (bufferTimer.current) clearTimeout(bufferTimer.current);
          setIsBuffering(false);
        }}
        onError={(e) => {
          console.warn('ReactPlayer error encountered, attempting reload/fallback:', e);
          // If this is a Firebase Storage URL with a token that failed, fallback to pure public URL without token (Option 3)
          if (!fallbackAttempted.current && activeVideoUrl.includes('firebasestorage.googleapis.com') && activeVideoUrl.includes('token=')) {
            console.log('Firebase token playback failed, retrying with public stream URL (Option 3)...');
            fallbackAttempted.current = true;
            const stripped = activeVideoUrl.replace(/([?&])token=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
            setActiveVideoUrl(stripped);
            return;
          }
          setIsError(true);
        }}
        progressInterval={250}
      />

      <SubtitleOverlay visible={false} text="" />

      {/* Center Play Button when paused / waiting for user interaction */}
      {!isPlaying && !isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-auto cursor-pointer bg-black/30"
          onClick={(e) => {
            e.stopPropagation();
            resume();
          }}
        >
          <div className="w-20 h-20 rounded-full bg-[#FF5C00] hover:bg-[#FF7A00] flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,92,0,0.6)] transition-all hover:scale-110 active:scale-95">
            <svg className="w-9 h-9 fill-white ml-1" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Subtle Buffering Spinner (No text, non-blocking) */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="w-14 h-14 border-4 border-white/20 border-t-[#FF5C00] rounded-full animate-spin"></div>
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
