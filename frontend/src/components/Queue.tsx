import React from "react";
import { ListMusic, Trash2, Music2, SkipForward } from "lucide-react";
import { Video } from "../types";

interface QueueProps {
  queue: Video[];
  onRemove: (index: number) => void;
  onSkipNext: () => void;
}

export const Queue: React.FC<QueueProps> = ({
  queue,
  onRemove,
  onSkipNext,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface-card border-l border-surface-border w-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListMusic className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Up Next ({queue.length})
          </h3>
        </div>

        {queue.length > 0 && (
          <button
            onClick={onSkipNext}
            title="Skip to next track"
            className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-brand-400 transition-colors"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-zinc-500 space-y-2">
            <Music2 className="w-8 h-8 stroke-1 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">Queue is empty</p>
            <p className="text-[11px] text-zinc-500 max-w-[180px]">
              Search and click "+ Queue" to queue up upcoming songs.
            </p>
          </div>
        ) : (
          queue.map((video, index) => (
            <div
              key={`${video.videoId}-${index}`}
              className="group flex items-center space-x-2.5 p-2 rounded-lg bg-surface-base hover:bg-surface-highlight border border-surface-border/60 transition-all"
            >
              <span className="text-[11px] font-mono text-zinc-500 w-4 text-center">
                {(index + 1).toString().padStart(2, "0")}
              </span>

              <div className="w-10 h-8 rounded bg-surface-card overflow-hidden flex-shrink-0">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                    ♪
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-brand-400 transition-colors">
                  {video.title}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {video.channelTitle || "YouTube Music"}
                </p>
              </div>

              <button
                onClick={() => onRemove(index)}
                title="Remove from queue"
                className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
