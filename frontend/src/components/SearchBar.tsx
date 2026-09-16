import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
}) => {
  const [value, setValue] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search by 400ms
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(value);
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, onSearch]);

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      onSearch(value);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search songs, artists, official music..."
        className="w-full pl-11 pr-10 py-2.5 bg-surface-card border border-surface-border rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-inner transition-all"
      />

      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
