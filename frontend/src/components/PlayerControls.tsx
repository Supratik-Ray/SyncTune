import React, { useState, useRef } from "react";
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
  // Scrubbing/dragging state using both state (for 60fps UI render) and ref (to strictly avoid duplicate commits)
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const isDraggingRef = useRef(false);
  const dragTimeRef = useRef(0);

  const displayTime = isDragging ? dragTime : currentTime;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    dragTimeRef.current = val;
    setDragTime(val);
  };

  const handlePointerDown = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragTimeRef.current = currentTime;
    setDragTime(currentTime);
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      onSeek(dragTimeRef.current);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const val = parseFloat((e.target as HTMLInputElement).value);
      onSeek(val);
    }
  };

  return (
    <div className="bg-surface-card/95 backdrop-blur-xl border-t border-surface-border px-3 py-2.5 sm:py-0 sm:px-6 z-30 select-none flex flex-col justify-center sm:h-24">
      {/* ========================================================================= */}
      {/* 1. MOBILE-ONLY TIMELINE ROW (Full width, easy finger dragging)           */}
      {/* ========================================================================= */}
      <div className="flex sm:hidden items-center space-x-2 w-full pb-2">
        <span className="text-[11px] font-mono text-zinc-400 min-w-[34px] text-right">
          {formatTime(displayTime)}
        </span>
        <div className="relative flex-1 flex items-center py-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={displayTime}
            disabled={!currentVideo}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onChange={handleSliderChange}
            onKeyUp={handleKeyUp}
            className="seek-slider w-full h-8"
            aria-label="Seek timeline"
          />
        </div>
        <span className="text-[11px] font-mono text-zinc-400 min-w-[34px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTROLS ROW (Mobile: Info + Buttons | Desktop: 3-column layout)  */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between w-full">
        {/* Track Info (Left) */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 flex-1 sm:flex-initial sm:w-1/4 min-w-0 sm:min-w-[140px] sm:max-w-[280px]">
          {currentVideo ? (
            <>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-surface-base border border-surface-border flex-shrink-0">
                {currentVideo.thumbnail ? (
                  <img
                    src={currentVideo.thumbnail}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </div>
              <div className="overflow-hidden pr-2 sm:pr-0">
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                  {currentVideo.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                  {currentVideo.channelTitle || "YouTube Music"}
                </p>
              </div>
            </>
          ) : (
            <div className="text-xs text-zinc-500 italic">No track playing</div>
          )}
        </div>

        {/* Center Controls (Buttons + Desktop Seekbar) */}
        <div className="flex flex-col items-center justify-center space-y-1.5 flex-shrink-0 sm:flex-1 sm:max-w-xl sm:px-6">
          {/* Action Buttons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => onSeek(0)}
              disabled={!currentVideo}
              title="Restart track"
              className="p-2 sm:p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentVideo}
              title={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-brand-400 text-black flex items-center justify-center transition-all transform active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
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
              className="p-2 sm:p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop-Only Integrated Seekbar */}
          <div className="hidden sm:flex w-full items-center space-x-2 text-[11px] font-mono text-zinc-400">
            <span className="w-10 text-right">{formatTime(displayTime)}</span>
            <div className="relative flex-1 flex items-center py-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={displayTime}
                disabled={!currentVideo}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onChange={handleSliderChange}
                onKeyUp={handleKeyUp}
                className="seek-slider w-full h-5"
                aria-label="Seek timeline"
              />
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Output Controls (Right - Hidden on mobile, visible on sm: screens) */}
        <div className="hidden sm:flex items-center justify-end space-x-2 w-1/4 min-w-[100px] max-w-[200px]">
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
            className="w-16 sm:w-24 h-1 bg-surface-highlight rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
