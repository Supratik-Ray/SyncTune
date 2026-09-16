import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import { Video } from "../types";

interface PlayerControlsProps {
  currentVideo: Video | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipNext: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentVideo,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onSkipNext,
  onVolumeChange,
  onToggleMute,
}) => {
  return (
    <div className="h-20 sm:h-24 bg-surface-card/95 backdrop-blur-xl border-t border-surface-border px-4 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* 1. Track Info (Left) */}
      <div className="flex items-center space-x-3 w-1/4 min-w-[140px] max-w-[280px]">
        {currentVideo ? (
          <>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-base border border-surface-border flex-shrink-0">
              {currentVideo.thumbnail ? (
                <img
                  src={currentVideo.thumbnail}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Music className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                {currentVideo.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate">
                {currentVideo.channelTitle || "YouTube Music"}
              </p>
            </div>
          </>
        ) : (
          <div className="text-xs text-zinc-500 italic">No track playing</div>
        )}
      </div>

      {/* 2. Main Controls & Seekbar (Center) */}
      <div className="flex flex-col items-center justify-center space-y-1.5 flex-1 max-w-xl px-2 sm:px-6">
        {/* Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onSeek(0)}
            disabled={!currentVideo}
            title="Restart track"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!currentVideo}
            title={isPlaying ? "Pause" : "Play"}
            className="w-10 h-10 rounded-full bg-white hover:bg-brand-400 text-black flex items-center justify-center transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onSkipNext}
            disabled={!currentVideo}
            title="Skip to next queued song"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Seekbar */}
        <div className="w-full flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              disabled={!currentVideo}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-highlight rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all"
            />
          </div>
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Volume & Output Controls (Right) */}
      <div className="flex items-center justify-end space-x-2 w-1/4 min-w-[100px] max-w-[200px]">
        <button
          onClick={onToggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
          className="w-16 sm:w-24 h-1 bg-surface-highlight rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};
