export interface User {
  socketId: string;
  nickname: string;
}

export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle?: string;
  duration?: string;
}

export interface ChatMessage {
  id: string;
  sender: User;
  text: string;
  timestamp: number;
}

export interface RoomState {
  code: string;
  users: User[];
  currentVideo: Video | null;
  queue: Video[];
  messages: ChatMessage[];
  isPlaying: boolean;
  baseTime: number;
  lastUpdatedAt: number;
  currentTime: number;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
