import React, { useState } from "react";
import {
  Music2,
  AlertTriangle,
  Video as VideoIcon,
  Disc3,
  Play,
  Volume2,
} from "lucide-react";
import { Video } from "../types";

interface YouTubePlayerProps {
  containerId: string;
  currentVideo: Video | null;
  playerError: string | null;
  isPlaying?: boolean;
  autoplayBlocked?: boolean;
  onTuneIn?: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  containerId,
  currentVideo,
  playerError,
  isPlaying = false,
  autoplayBlocked = false,
  onTuneIn,
}) => {
  const [viewMode, setViewMode] = useState<"artwork" | "video">("artwork");

  const thumbnailUrl = currentVideo
    ? currentVideo.thumbnail ||
      `https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`
    : "";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {playerError && (
        <div className="mb-4 w-full max-w-2xl bg-amber-950/60 border border-amber-800/50 rounded-xl p-3 flex items-center space-x-3 text-amber-200 text-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>{playerError}</span>
        </div>
      )}

      {/* Main Showcase Frame */}
      <div className="w-full max-w-3xl aspect-video rounded-3xl overflow-hidden bg-black/95 border border-surface-border shadow-2xl relative flex items-center justify-center">
        {/* ========================================================================= */}
        {/* Layer 1: COMPLETELY ISOLATED YOUTUBE IFRAME WRAPPER                       */}
        {/* This wrapper element has strictly ONE child that never unmounts or changes. */}
        {/* React will never call insertBefore/removeChild on children of this wrapper. */}
        {/* ========================================================================= */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            viewMode === "video" && currentVideo
              ? "z-10 opacity-100 pointer-events-auto"
              : "z-0 opacity-0 pointer-events-none"
          }`}
        >
          <div id={containerId} className="w-full h-full" />
        </div>

        {/* ========================================================================= */}
        {/* Layer 2: REACT UI LAYER (Artwork, Glow, Empty State)                      */}
        {/* Completely isolated from YouTube's DOM mutation so React never crashes.    */}
        {/* ========================================================================= */}
        <div
          className={`relative z-10 w-full h-full flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            viewMode === "video" ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Ambient Artwork Glow */}
          {currentVideo && thumbnailUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-125 pointer-events-none transition-all duration-1000"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}

          {/* 1. Artwork Showcase Mode */}
          {currentVideo && viewMode === "artwork" && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 pointer-events-auto animate-fade-in">
              <div className="relative group">
                {/* Animated Vinyl Disc */}
                <div
                  className={`absolute -right-3 top-2 w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-zinc-950 border-4 border-zinc-800 shadow-2xl flex items-center justify-center transition-all duration-700 ${
                    isPlaying
                      ? "translate-x-6 sm:translate-x-10 rotate-180"
                      : "translate-x-0"
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-zinc-700 bg-gradient-to-tr from-brand-500/20 to-teal-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-surface-base border border-zinc-700" />
                  </div>
                </div>

                {/* Album Cover Thumbnail */}
                <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface-card flex items-center justify-center">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={currentVideo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music2 className="w-16 h-16 text-brand-500 animate-pulse" />
                  )}

                  {/* Equalizer Indicator when playing */}
                  {isPlaying && (
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md flex items-end space-x-1 border border-white/10 shadow-lg">
                      <span className="w-1 h-3 bg-brand-400 animate-pulse rounded-full" />
                      <span className="w-1 h-5 bg-brand-400 animate-pulse rounded-full [animation-delay:150ms]" />
                      <span className="w-1 h-2.5 bg-brand-400 animate-pulse rounded-full [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Empty State when nothing is playing */}
          {!currentVideo && (
            <div className="flex flex-col items-center justify-center space-y-4 text-center p-6 z-10 pointer-events-auto">
              <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-zinc-500 shadow-inner">
                <Music2 className="w-8 h-8 text-brand-500 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-bold text-zinc-200">
                  Ready to stream together
                </h3>
                <p className="text-sm text-zinc-400">
                  Search for an artist or song above, then click Play or Add to
                  Queue to begin synchronized playback.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Layer 3: FLOATING OVERLAYS & CONTROLS (Always on top with z-30)           */}
        {/* ========================================================================= */}

        {/* View Mode Floating Toggle Button (Top Right) */}
        {currentVideo && (
          <div className="absolute top-4 right-4 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "artwork" ? "video" : "artwork")
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black border border-white/20 text-zinc-200 hover:text-white backdrop-blur-md text-xs font-semibold transition-all shadow-xl hover:scale-105 active:scale-95"
              title={
                viewMode === "artwork"
                  ? "Switch to Video"
                  : "Hide Video & Show Artwork"
              }
            >
              {viewMode === "artwork" ? (
                <>
                  <VideoIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span>Watch Video</span>
                </>
              ) : (
                <>
                  <Disc3 className="w-3.5 h-3.5 text-brand-400" />
                  <span>Show Artwork</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Autoplay Blocked Tune-In Overlay */}
        {autoplayBlocked && isPlaying && currentVideo && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6 text-center space-y-4 animate-fade-in pointer-events-auto">
            <div className="w-14 h-14 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 animate-pulse">
              <Volume2 className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-white">
                Music is playing in this room
              </h3>
              <p className="text-xs text-zinc-400">
                Click below to tune in and sync audio with everyone.
              </p>
            </div>
            <button
              type="button"
              onClick={onTuneIn}
              className="flex items-center space-x-2 px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-2xl transition-all hover:scale-105 active:scale-95 animate-bounce"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Click to Tune In & Listen</span>
            </button>
          </div>
        )}
      </div>

      {/* Song Title & Channel Details */}
      {currentVideo && (
        <div className="mt-3 text-center max-w-2xl px-4 space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 truncate">
            {currentVideo.title}
          </h2>
          {currentVideo.channelTitle && (
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              {currentVideo.channelTitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
