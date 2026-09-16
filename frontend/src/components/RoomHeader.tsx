import React, { useState } from "react";
import { Copy, Check, Users, LogOut, Radio } from "lucide-react";
import { ConnectionStatus } from "../types";

interface RoomHeaderProps {
  roomCode: string;
  userCount: number;
  connectionStatus: ConnectionStatus;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomCode,
  userCount,
  connectionStatus,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-surface-card/90 backdrop-blur-md border-b border-surface-border flex items-center justify-between z-20">
      {/* Brand & Room Info */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white hidden sm:inline">
            SyncTune
          </span>
        </div>

        <div className="h-4 w-px bg-surface-border hidden sm:block" />

        {/* Room Code & Copy Actions */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Room:
          </span>
          <span className="px-2.5 py-1 bg-surface-base border border-surface-border rounded-lg font-mono font-bold text-sm tracking-widest text-brand-400">
            {roomCode}
          </span>

          <button
            onClick={handleCopyCode}
            title="Copy room code"
            className="p-1.5 hover:bg-surface-highlight text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors border border-transparent hover:border-surface-border flex items-center space-x-1 text-xs"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {copiedCode ? "Copied" : "Code"}
            </span>
          </button>

          <button
            onClick={handleCopyInvite}
            title="Copy invite link"
            className="hidden sm:flex p-1.5 hover:bg-surface-highlight text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors border border-transparent hover:border-surface-border items-center space-x-1 text-xs"
          >
            {copiedInvite ? (
              <Check className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {copiedInvite ? "Copied Link" : "Invite"}
            </span>
          </button>
        </div>
      </div>

      {/* Connection & Presence Status */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Connection Status Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface-base border border-surface-border text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-brand-500 animate-pulse"
                : connectionStatus === "reconnecting"
                  ? "bg-amber-400 animate-ping"
                  : "bg-red-500"
            }`}
          />
          <span className="text-zinc-400 capitalize hidden sm:inline">
            {connectionStatus}
          </span>
        </div>

        {/* Listeners Count */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-base border border-surface-border text-xs text-zinc-300">
          <Users className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold">{userCount}</span>
          <span className="text-zinc-400 hidden sm:inline">
            {userCount === 1 ? "listener" : "listeners"}
          </span>
        </div>

        {/* Leave Room */}
        <button
          onClick={onLeaveRoom}
          title="Leave Room"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-base hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-surface-border hover:border-red-800/40 text-xs font-semibold transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
};
