import { useState, useEffect, useRef, useCallback } from "react";
import { Video } from "../types";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerProps {
  currentVideo: Video | null;
  isPlaying: boolean;
  baseTime: number;
  lastUpdatedAt: number;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
  onVideoEnded: () => void;
}

export function useYouTubePlayer({
  currentVideo,
  isPlaying,
  baseTime,
  lastUpdatedAt,
  onPlay,
  onPause,
  onSeek,
  onVideoEnded,
}: UseYouTubePlayerProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const playerRef = useRef<any>(null);
  const isApplyingRemoteUpdate = useRef(false);
  const lastLoadedVideoIdRef = useRef<string | null>(null);
  const containerId = "youtube-player-element";

  // Fresh references to prevent stale closures in async callbacks & events
  const currentVideoRef = useRef(currentVideo);
  currentVideoRef.current = currentVideo;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const baseTimeRef = useRef(baseTime);
  baseTimeRef.current = baseTime;

  const lastUpdatedAtRef = useRef(lastUpdatedAt);
  lastUpdatedAtRef.current = lastUpdatedAt;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;

  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const onVideoEndedRef = useRef(onVideoEnded);
  onVideoEndedRef.current = onVideoEnded;

  // Calculate expected room time accurately
  const getExpectedRoomTime = useCallback(() => {
    const playing = isPlayingRef.current;
    const bTime = baseTimeRef.current;
    const updated = lastUpdatedAtRef.current;

    if (!playing) {
      return bTime;
    }
    const elapsedSeconds = (Date.now() - updated) / 1000;
    return Math.max(0, bTime + elapsedSeconds);
  }, []);

  // 1. Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      return;
    }
    const existingScript = document.querySelector(
      'script[src*="youtube.com/iframe_api"]',
    );
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 2. Initialize YouTube Player ONLY when there is a current video and DOM container is mounted
  const activeVideoId = currentVideo?.videoId;
  useEffect(() => {
    // If no song has been picked yet, wait
    if (!activeVideoId) {
      return;
    }

    // If player already exists and is initialized, don't recreate it
    if (playerRef.current) {
      return;
    }

    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return false;
      const el = document.getElementById(containerId);
      if (!el) return false;

      const vid = currentVideoRef.current;
      if (!vid?.videoId) return false;

      lastLoadedVideoIdRef.current = vid.videoId;
      const expected = getExpectedRoomTime();

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          videoId: vid.videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            fs: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            start: Math.max(0, Math.floor(expected)),
          },
          events: {
            onReady: (event: any) => {
              setPlayerReady(true);
              setPlayerError(null);
              event.target.setVolume(volumeRef.current);

              const currentExpected = getExpectedRoomTime();
              const latestVid = currentVideoRef.current;
              const playing = isPlayingRef.current;

              // If active song changed while iframe was mounting
              if (
                latestVid &&
                latestVid.videoId !== lastLoadedVideoIdRef.current
              ) {
                lastLoadedVideoIdRef.current = latestVid.videoId;
                event.target.loadVideoById({
                  videoId: latestVid.videoId,
                  startSeconds: currentExpected,
                });
              } else {
                event.target.seekTo(currentExpected, true);
              }

              if (playing) {
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
            },
            onStateChange: (event: any) => {
              if (!playerRef.current) return;

              if (event.data === window.YT.PlayerState.PLAYING) {
                setAutoplayBlocked(false);
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                onVideoEndedRef.current();
                return;
              }

              // Prevent remote sync from triggering local broadcast loops
              if (isApplyingRemoteUpdate.current) {
                return;
              }

              const currentTime = playerRef.current.getCurrentTime?.() || 0;

              if (event.data === window.YT.PlayerState.PLAYING) {
                onPlayRef.current(currentTime);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                onPauseRef.current(currentTime);
              }
            },
            onError: (event: any) => {
              console.error("YouTube Player error code:", event.data);
              if (event.data === 150 || event.data === 101) {
                setPlayerError(
                  "This video cannot be embedded due to owner restrictions. Please try another song.",
                );
              } else {
                setPlayerError(
                  "This video could not be played. Please pick another song.",
                );
              }
            },
          },
        });
        return true;
      } catch (err) {
        console.error("Failed to initialize YT.Player:", err);
        return false;
      }
    };

    if (!initPlayer()) {
      checkInterval = setInterval(() => {
        if (initPlayer() && checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }, 200);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    };
  }, [activeVideoId, containerId, getExpectedRoomTime]);

  // 3. Handle changing songs when player is ALREADY initialized
  useEffect(() => {
    if (!playerRef.current || !playerReady || !activeVideoId) return;

    if (lastLoadedVideoIdRef.current !== activeVideoId) {
      lastLoadedVideoIdRef.current = activeVideoId;
      setPlayerError(null);
      isApplyingRemoteUpdate.current = true;
      const expected = getExpectedRoomTime();

      try {
        playerRef.current.loadVideoById({
          videoId: activeVideoId,
          startSeconds: expected,
        });

        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {
        console.error("Failed to loadVideoById:", e);
      }

      setTimeout(() => {
        isApplyingRemoteUpdate.current = false;
      }, 600);
    }
  }, [activeVideoId, playerReady, isPlaying, getExpectedRoomTime]);

  // 4. Synchronize Play/Pause when roomState changes remotely
  useEffect(() => {
    if (!playerRef.current || !playerReady || !currentVideo) return;

    try {
      const playerState = playerRef.current.getPlayerState?.();
      const isPlayerPlaying = playerState === window.YT?.PlayerState?.PLAYING;

      if (isPlaying && !isPlayerPlaying) {
        isApplyingRemoteUpdate.current = true;
        const expected = getExpectedRoomTime();
        playerRef.current.seekTo(expected, true);
        playerRef.current.playVideo();
        setTimeout(() => {
          isApplyingRemoteUpdate.current = false;
        }, 300);
      } else if (!isPlaying && isPlayerPlaying) {
        isApplyingRemoteUpdate.current = true;
        const expected = getExpectedRoomTime();
        playerRef.current.seekTo(expected, true);
        playerRef.current.pauseVideo();
        setTimeout(() => {
          isApplyingRemoteUpdate.current = false;
        }, 300);
      }
    } catch (_) {}
  }, [isPlaying, currentVideo, playerReady, getExpectedRoomTime]);

  // 5. Autoplay Blocked Detector:
  // Detects if the room is playing but the browser blocked autoplay without interaction
  useEffect(() => {
    if (!playerReady || !currentVideo || !isPlaying) {
      setAutoplayBlocked(false);
      return;
    }

    const timer = setTimeout(() => {
      if (playerRef.current && isPlaying) {
        try {
          const state = playerRef.current.getPlayerState?.();
          // State 1 is PLAYING, State 3 is BUFFERING
          if (state !== 1 && state !== 3) {
            setAutoplayBlocked(true);
          } else {
            setAutoplayBlocked(false);
          }
        } catch (_) {}
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentVideo, playerReady]);

  // 6. Periodic Drift Correction & Progress Tracker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || !playerReady || !currentVideo) return;

      try {
        const localTime = playerRef.current.getCurrentTime?.() || 0;
        const vidDuration = playerRef.current.getDuration?.() || 0;
        setLocalCurrentTime(localTime);
        if (vidDuration > 0) {
          setDuration(vidDuration);
        }

        if (isPlaying && !isApplyingRemoteUpdate.current) {
          const expected = getExpectedRoomTime();
          const drift = Math.abs(expected - localTime);

          // If drift exceeds 0.75s, smoothly align
          if (drift > 0.75) {
            isApplyingRemoteUpdate.current = true;
            playerRef.current.seekTo(expected, true);
            setTimeout(() => {
              isApplyingRemoteUpdate.current = false;
            }, 300);
          }
        }
      } catch (_) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, playerReady, currentVideo, getExpectedRoomTime]);

  // 7. Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
        setPlayerReady(false);
      }
    };
  }, []);

  // Explicit user action to tune into an ongoing stream
  const handleTuneIn = useCallback(() => {
    if (!playerRef.current) return;
    setAutoplayBlocked(false);
    isApplyingRemoteUpdate.current = true;
    const expected = getExpectedRoomTime();
    try {
      playerRef.current.seekTo?.(expected, true);
      playerRef.current.playVideo?.();
      if (playerRef.current.isMuted?.()) {
        playerRef.current.unMute?.();
      }
    } catch (e) {
      console.error("Failed to tune in:", e);
    }
    setTimeout(() => {
      isApplyingRemoteUpdate.current = false;
    }, 500);
  }, [getExpectedRoomTime]);

  // User Control Handlers (triggered from UI player bar)
  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current) return;
    setAutoplayBlocked(false);
    try {
      const current = playerRef.current.getCurrentTime?.() || 0;
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
        onPauseRef.current(current);
      } else {
        playerRef.current.playVideo?.();
        onPlayRef.current(current);
      }
    } catch (e) {
      console.error("Failed to toggle play:", e);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((newTime: number) => {
    if (!playerRef.current) return;
    setAutoplayBlocked(false);
    isApplyingRemoteUpdate.current = true;
    try {
      playerRef.current.seekTo?.(newTime, true);
      setLocalCurrentTime(newTime);
    } catch (e) {
      console.error("Failed to seek:", e);
    }
    setTimeout(() => {
      isApplyingRemoteUpdate.current = false;
    }, 300);
    onSeekRef.current(newTime);
  }, []);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      if (playerRef.current) {
        try {
          playerRef.current.setVolume?.(newVolume);
          if (newVolume > 0 && isMuted) {
            playerRef.current.unMute?.();
            setIsMuted(false);
          }
        } catch (_) {}
      }
    },
    [isMuted],
  );

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute?.();
        setIsMuted(false);
      } else {
        playerRef.current.mute?.();
        setIsMuted(true);
      }
    } catch (_) {}
  }, [isMuted]);

  return {
    containerId,
    playerReady,
    playerError,
    localCurrentTime,
    duration,
    volume,
    isMuted,
    autoplayBlocked,
    tuneIn: handleTuneIn,
    togglePlay: handleTogglePlay,
    seek: handleSeek,
    setVolume: handleVolumeChange,
    toggleMute: handleToggleMute,
  };
}
