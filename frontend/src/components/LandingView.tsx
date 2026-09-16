import React, { useState } from "react";
import { Music, Radio, Users, Sparkles, ArrowRight, Disc3 } from "lucide-react";

interface LandingViewProps {
  onCreateRoom: (nickname: string) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
  error?: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  error,
}) => {
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(nickname.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim(), nickname.trim());
  };

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 flex flex-col items-center text-center space-y-8">
        {/* Brand Header */}
        <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-surface-card border border-surface-border shadow-lg">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-wider text-brand-400 uppercase">
            SyncTune MVP
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Listen together.
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Stay in perfect sync.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto">
            Experience real-time synchronized YouTube music with your friends.
            No accounts, no database, just instant shared listening.
          </p>
        </div>

        {error && (
          <div className="w-full max-w-md bg-red-950/50 border border-red-800/60 text-red-200 px-4 py-3 rounded-xl text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Action Panel */}
        <div className="w-full max-w-md bg-surface-card/90 backdrop-blur-xl border border-surface-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
          {/* Nickname input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Your Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cosmic Dolphin"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={25}
              className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
            />
          </div>

          <div className="flex border-b border-surface-border pb-1">
            <button
              type="button"
              onClick={() => setIsJoining(false)}
              className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${
                !isJoining
                  ? "text-brand-400 border-b-2 border-brand-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setIsJoining(true)}
              className={`flex-1 py-2 text-sm font-semibold text-center transition-colors ${
                isJoining
                  ? "text-brand-400 border-b-2 border-brand-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Join Room
            </button>
          </div>

          {!isJoining ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate a temporary room code and invite your friends to start
                a live listening session.
              </p>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-black font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-brand-500/25 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start New Room</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  5-Digit Room Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. AB7K2"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 bg-surface-base border border-surface-border rounded-xl text-zinc-100 placeholder-zinc-500 text-center tracking-widest font-mono text-lg uppercase focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-brand-500/25 active:scale-[0.98]"
              >
                <span>Join Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left pt-4">
          <div className="p-4 rounded-xl bg-surface-card/60 border border-surface-border/50 flex flex-col space-y-2">
            <Disc3 className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Sub-Second Sync
            </h3>
            <p className="text-xs text-zinc-400">
              Continuous drift correction ensures all listeners hear the exact
              same beat.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-card/60 border border-surface-border/50 flex flex-col space-y-2">
            <Music className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Collaborative Queue
            </h3>
            <p className="text-xs text-zinc-400">
              Anyone in the room can search songs and queue up the next hit.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-card/60 border border-surface-border/50 flex flex-col space-y-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Zero Accounts
            </h3>
            <p className="text-xs text-zinc-400">
              Rooms live exclusively in server memory and vanish when everyone
              leaves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
