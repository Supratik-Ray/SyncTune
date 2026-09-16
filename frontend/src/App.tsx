import { useState, useEffect, useCallback, useRef } from "react";
import { useRoom } from "./hooks/useRoom";
import { useYouTubePlayer } from "./hooks/useYouTubePlayer";
import { LandingView } from "./components/LandingView";
import { RoomHeader } from "./components/RoomHeader";
import { YouTubePlayer } from "./components/YouTubePlayer";
import { PlayerControls } from "./components/PlayerControls";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { Queue } from "./components/Queue";
import { UserList } from "./components/UserList";
import { ChatBox } from "./components/ChatBox";
import { Video } from "./types";
import { ListMusic, Users, Info, MessageSquare } from "lucide-react";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/+$/, "");

export function App() {
  const {
    roomState,
    currentUser,
    messages,
    connectionStatus,
    notification,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    play,
    pause,
    seek,
    changeVideo,
    addToQueue,
    removeFromQueue,
    skipTrack,
    onVideoEnded,
    sendMessage,
  } = useRoom();

  // Search state
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<
    "queue" | "chat" | "users"
  >("queue");

  const hasAutoJoinedRef = useRef(false);

  // Handle explicit leave room action
  const handleLeaveRoom = useCallback(() => {
    hasAutoJoinedRef.current = true; // prevent re-auto-joining if ?room= was in URL
    // Clean up ?room=... from URL bar so it doesn't auto-rejoin
    const url = new URL(window.location.href);
    if (url.searchParams.has("room")) {
      url.searchParams.delete("room");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? url.search : ""),
      );
    }
    leaveRoom();
  }, [leaveRoom]);

  // Check URL params for invite link (?room=CODE) - only auto-join once on initial page load
  useEffect(() => {
    if (hasAutoJoinedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room");
    if (roomFromUrl && !roomState) {
      hasAutoJoinedRef.current = true;
      joinRoom(roomFromUrl);
    }
  }, [joinRoom, roomState]);

  // YouTube Player hook integration
  const {
    containerId,
    playerError,
    localCurrentTime,
    duration,
    volume,
    isMuted,
    autoplayBlocked,
    tuneIn,
    togglePlay,
    seek: playerSeek,
    setVolume,
    toggleMute,
  } = useYouTubePlayer({
    currentVideo: roomState?.currentVideo || null,
    isPlaying: roomState?.isPlaying || false,
    baseTime: roomState?.baseTime || 0,
    lastUpdatedAt: roomState?.lastUpdatedAt || Date.now(),
    onPlay: play,
    onPause: pause,
    onSeek: seek,
    onVideoEnded,
  });

  // Handle Search API calls
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Failed to search songs:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // If not in a room, render Landing Page
  if (!roomState) {
    return (
      <LandingView
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-zinc-100 flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Header */}
      <RoomHeader
        roomCode={roomState.code}
        userCount={roomState.users.length}
        connectionStatus={connectionStatus}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Transient Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-brand-500/90 text-black font-semibold text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur flex items-center space-x-2 animate-fade-in">
          <Info className="w-3.5 h-3.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Center Panel: Search & YouTube Player */}
        <section className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top Search Bar */}
          <div className="w-full">
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          </div>

          {/* Search Results Dropdown/Overlay if active */}
          {hasSearched && (
            <div className="bg-surface-card/95 border border-surface-border rounded-2xl shadow-2xl p-2 relative animate-fade-in">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border text-xs text-zinc-400">
                <span>Search Results</span>
                <button
                  onClick={() => setHasSearched(false)}
                  className="hover:text-zinc-100 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
              <SearchResults
                results={searchResults}
                isLoading={isSearching}
                onPlayNow={(v) => {
                  changeVideo(v);
                  setHasSearched(false);
                }}
                onAddToQueue={(v) => {
                  addToQueue(v);
                }}
              />
            </div>
          )}

          {/* YouTube Video Player View */}
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <YouTubePlayer
              containerId={containerId}
              currentVideo={roomState.currentVideo}
              playerError={playerError}
              isPlaying={roomState.isPlaying}
              autoplayBlocked={autoplayBlocked}
              onTuneIn={tuneIn}
            />
          </div>
        </section>

        {/* Right Sidebar: Queue, Chat & Listeners */}
        <aside className="w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l border-surface-border bg-surface-card/80">
          {/* Sidebar Tab Switcher */}
          <div className="flex border-b border-surface-border bg-surface-card">
            <button
              onClick={() => setActiveSideTab("queue")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                activeSideTab === "queue"
                  ? "text-brand-400 border-b-2 border-brand-400 bg-surface-highlight/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Queue ({roomState.queue.length})</span>
            </button>
            <button
              onClick={() => setActiveSideTab("chat")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors relative ${
                activeSideTab === "chat"
                  ? "text-brand-400 border-b-2 border-brand-400 bg-surface-highlight/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat ({messages.length})</span>
            </button>
            <button
              onClick={() => setActiveSideTab("users")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                activeSideTab === "users"
                  ? "text-brand-400 border-b-2 border-brand-400 bg-surface-highlight/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Listeners ({roomState.users.length})</span>
            </button>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSideTab === "queue" && (
              <div className="flex-1 overflow-hidden">
                <Queue
                  queue={roomState.queue}
                  onRemove={removeFromQueue}
                  onSkipNext={skipTrack}
                />
              </div>
            )}

            {activeSideTab === "chat" && (
              <div className="flex-1 overflow-hidden">
                <ChatBox
                  messages={messages}
                  currentUser={currentUser}
                  onSendMessage={sendMessage}
                />
              </div>
            )}

            {activeSideTab === "users" && (
              <div className="flex-1 overflow-y-auto">
                <UserList
                  users={roomState.users}
                  currentUserId={currentUser?.socketId}
                />
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* 3. Bottom Persistent Player Bar */}
      <PlayerControls
        currentVideo={roomState.currentVideo}
        isPlaying={roomState.isPlaying}
        currentTime={localCurrentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onTogglePlay={togglePlay}
        onSeek={playerSeek}
        onSkipNext={skipTrack}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
export default App;
