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

  const playerRef = useRef<any>(null);
  const isApplyingRemoteUpdate = useRef(false);
  const containerId = "youtube-player-element";

  // Calculate expected room time
  const getExpectedRoomTime = useCallback(() => {
    if (!isPlaying) {
      return baseTime;
    }
    const elapsedSeconds = (Date.now() - lastUpdatedAt) / 1000;
    return Math.max(0, baseTime + elapsedSeconds);
  }, [isPlaying, baseTime, lastUpdatedAt]);

  // 1. Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // 2. Initialize YouTube player instance
  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return false;
      const el = document.getElementById(containerId);
      if (!el) return false;

      // Clean up existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
      }

      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: currentVideo ? currentVideo.videoId : "",
        playerVars: {
          autoplay: 1,
          controls: 1,
          disablekb: 0,
          fs: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            setPlayerError(null);
            event.target.setVolume(volume);

            const expected = getExpectedRoomTime();
            if (currentVideo) {
              isApplyingRemoteUpdate.current = true;
              event.target.seekTo(expected, true);
              if (isPlaying) {
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
              setTimeout(() => {
                isApplyingRemoteUpdate.current = false;
              }, 400);
            }
          },
          onStateChange: (event: any) => {
            if (!playerRef.current) return;

            // When local player ends video
            if (event.data === window.YT.PlayerState.ENDED) {
              onVideoEnded();
              return;
            }

            // Prevent remote sync from triggering local broadcast loops
            if (isApplyingRemoteUpdate.current) {
              return;
            }

            const currentTime = playerRef.current.getCurrentTime() || 0;

            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay(currentTime);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPause(currentTime);
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
    };

    if (!initPlayer()) {
      checkInterval = setInterval(() => {
        if (initPlayer() && checkInterval) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // 3. Handle video ID changes
  const activeVideoId = currentVideo?.videoId;
  useEffect(() => {
    if (!playerRef.current || !playerReady || !activeVideoId) return;

    const currentLoadedId = playerRef.current.getVideoData?.()?.video_id;
    if (currentLoadedId !== activeVideoId) {
      setPlayerError(null);
      isApplyingRemoteUpdate.current = true;
      const expected = getExpectedRoomTime();
      playerRef.current.loadVideoById({
        videoId: activeVideoId,
        startSeconds: expected,
      });
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
      setTimeout(() => {
        isApplyingRemoteUpdate.current = false;
      }, 500);
    }
  }, [activeVideoId, playerReady, isPlaying, getExpectedRoomTime]);

  // 4. Synchronize Play/Pause when roomState changes remotely
  useEffect(() => {
    if (!playerRef.current || !playerReady || !currentVideo) return;

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
  }, [isPlaying, currentVideo, playerReady, getExpectedRoomTime]);

  // 5. Periodic Drift Correction & Progress Tracker (Every 1.5 - 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || !playerReady || !currentVideo) return;

      try {
        const localTime = playerRef.current.getCurrentTime() || 0;
        const vidDuration = playerRef.current.getDuration() || 0;
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

  // 6. User Control Handlers (triggered from UI player bar)
  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    const current = playerRef.current.getCurrentTime() || 0;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      onPause(current);
    } else {
      playerRef.current.playVideo();
      onPlay(current);
    }
  }, [isPlaying, playerReady, onPlay, onPause]);

  const handleSeek = useCallback(
    (newTime: number) => {
      if (!playerRef.current || !playerReady) return;
      isApplyingRemoteUpdate.current = true;
      playerRef.current.seekTo(newTime, true);
      setLocalCurrentTime(newTime);
      setTimeout(() => {
        isApplyingRemoteUpdate.current = false;
      }, 300);
      onSeek(newTime);
    },
    [playerReady, onSeek],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      if (playerRef.current && playerReady) {
        playerRef.current.setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      }
    },
    [playerReady, isMuted],
  );

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [playerReady, isMuted]);

  return {
    containerId,
    playerReady,
    playerError,
    localCurrentTime,
    duration,
    volume,
    isMuted,
    togglePlay: handleTogglePlay,
    seek: handleSeek,
    setVolume: handleVolumeChange,
    toggleMute: handleToggleMute,
  };
}
