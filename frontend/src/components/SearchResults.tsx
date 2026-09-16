import { Play, Plus, Music } from "lucide-react";
import { Video } from "../types";

interface SearchResultsProps {
  results: Video[];
  isLoading: boolean;
  onPlayNow: (video: Video) => void;
  onAddToQueue: (video: Video) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  onPlayNow,
  onAddToQueue,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 text-zinc-400">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Searching music catalog...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-2">
        <Music className="w-10 h-10 stroke-1" />
        <p className="text-sm font-medium text-zinc-300">No music found</p>
        <p className="text-xs text-zinc-500">
          Try searching for an artist, track title, or genre.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
      {results.map((video) => (
        <div
          key={video.videoId}
          className="group flex items-center space-x-3 p-2.5 rounded-xl bg-surface-card hover:bg-surface-highlight border border-surface-border transition-all hover:border-zinc-700"
        >
          {/* Thumbnail */}
          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-surface-base flex-shrink-0">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Music className="w-4 h-4" />
              </div>
            )}
            {video.duration && (
              <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] font-mono text-zinc-300 leading-none">
                {video.duration}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4
              className="text-xs font-semibold text-zinc-100 truncate group-hover:text-brand-400 transition-colors"
              title={video.title}
            >
              {video.title}
            </h4>
            <p className="text-[11px] text-zinc-400 truncate">
              {video.channelTitle || "Artist"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPlayNow(video)}
              title="Play Now"
              className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-black transition-transform active:scale-95 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={() => onAddToQueue(video)}
              title="Add to Queue"
              className="p-1.5 rounded-lg bg-surface-highlight hover:bg-zinc-700 text-zinc-300 hover:text-white border border-surface-border transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
