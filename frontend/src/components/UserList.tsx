import React from "react";
import { Users, Headphones } from "lucide-react";
import { User } from "../types";

interface UserListProps {
  users: User[];
  currentUserId?: string;
}

export const UserList: React.FC<UserListProps> = ({ users, currentUserId }) => {
  return (
    <div className="bg-surface-card border-l border-surface-border p-4 flex flex-col space-y-3">
      <div className="flex items-center space-x-2 text-zinc-400">
        <Users className="w-4 h-4 text-brand-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Listeners ({users.length})
        </h3>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-48">
        {users.map((user) => {
          const isMe = user.socketId === currentUserId;
          return (
            <div
              key={user.socketId}
              className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                isMe
                  ? "bg-brand-500/10 border border-brand-500/20 text-brand-300"
                  : "bg-surface-base border border-surface-border/50 text-zinc-300"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  isMe
                    ? "bg-brand-500 text-black"
                    : "bg-surface-highlight text-zinc-300 border border-surface-border"
                }`}
              >
                {user.nickname.charAt(0).toUpperCase()}
              </div>

              <span className="truncate flex-1 font-medium">
                {user.nickname}
              </span>

              {isMe ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold">
                  You
                </span>
              ) : (
                <Headphones className="w-3 h-3 text-zinc-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
