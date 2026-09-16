import React from "react";
import { Music2, AlertTriangle } from "lucide-react";
import { Video } from "../types";

interface YouTubePlayerProps {
  containerId: string;
  currentVideo: Video | null;
  playerError: string | null;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  containerId,
  currentVideo,
  playerError,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {playerError && (
        <div className="mb-4 w-full max-w-2xl bg-amber-950/60 border border-amber-800/50 rounded-xl p-3 flex items-center space-x-3 text-amber-200 text-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>{playerError}</span>
        </div>
      )}

      <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-black/80 border border-surface-border shadow-2xl relative flex items-center justify-center">
        {/* Always render the container DOM element so YouTube IFrame API has a stable target */}
        <div
          id={containerId}
          className={`w-full h-full ${!currentVideo ? "hidden" : "block"}`}
        />

        {/* Empty state when no video is selected yet */}
        {!currentVideo && (
          <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-zinc-500">
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

      {currentVideo && (
        <div className="mt-4 text-center max-w-2xl">
          <h2 className="text-lg font-bold text-zinc-100 truncate">
            {currentVideo.title}
          </h2>
          {currentVideo.channelTitle && (
            <p className="text-sm text-zinc-400">{currentVideo.channelTitle}</p>
          )}
        </div>
      )}
    </div>
  );
};
