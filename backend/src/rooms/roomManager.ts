import { User, Video, RoomState, ChatMessage } from "../types";

export interface RoomInternal {
  code: string;
  users: Map<string, User>;
  currentVideo: Video | null;
  queue: Video[];
  messages: ChatMessage[];
  isPlaying: boolean;
  baseTime: number;
  lastUpdatedAt: number;
  cleanupTimeout?: NodeJS.Timeout;
}

export class RoomManager {
  private rooms: Map<string, RoomInternal> = new Map();
  // Map socketId -> roomCode for quick disconnect lookups
  private socketToRoom: Map<string, string> = new Map();

  private generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code: string;
    do {
      code = "";
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public getExpectedTime(room: RoomInternal): number {
    if (!room.isPlaying) {
      return room.baseTime;
    }
    const elapsedSeconds = (Date.now() - room.lastUpdatedAt) / 1000;
    return Math.max(0, room.baseTime + elapsedSeconds);
  }

  public serialize(room: RoomInternal): RoomState {
    return {
      code: room.code,
      users: Array.from(room.users.values()),
      currentVideo: room.currentVideo,
      queue: [...room.queue],
      messages: [...room.messages],
      isPlaying: room.isPlaying,
      baseTime: room.baseTime,
      lastUpdatedAt: room.lastUpdatedAt,
      currentTime: this.getExpectedTime(room),
    };
  }

  public createRoom(creator: User): RoomInternal {
    const code = this.generateRoomCode();
    const room: RoomInternal = {
      code,
      users: new Map([[creator.socketId, creator]]),
      currentVideo: null,
      queue: [],
      messages: [],
      isPlaying: false,
      baseTime: 0,
      lastUpdatedAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(creator.socketId, code);
    return room;
  }

  public getRoom(code: string): RoomInternal | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  public getRoomBySocketId(socketId: string): RoomInternal | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  public joinRoom(code: string, user: User): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    // If there was an active cleanup timeout, cancel it
    if (room.cleanupTimeout) {
      clearTimeout(room.cleanupTimeout);
      room.cleanupTimeout = undefined;
    }

    room.users.set(user.socketId, user);
    this.socketToRoom.set(user.socketId, room.code);
    return room;
  }

  public leaveRoom(
    socketId: string,
  ): { room: RoomInternal; user: User } | null {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const user = room.users.get(socketId);
    room.users.delete(socketId);
    this.socketToRoom.delete(socketId);

    // If room is now empty, schedule deletion after grace period (5 minutes)
    if (room.users.size === 0) {
      room.cleanupTimeout = setTimeout(
        () => {
          if (room.users.size === 0) {
            this.rooms.delete(room.code);
          }
        },
        5 * 60 * 1000,
      );
    }

    return user ? { room, user } : null;
  }

  public play(code: string, currentTime: number): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.isPlaying = true;
    room.baseTime = Math.max(0, currentTime);
    room.lastUpdatedAt = Date.now();
    return room;
  }

  public pause(code: string, currentTime: number): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.isPlaying = false;
    room.baseTime = Math.max(0, currentTime);
    room.lastUpdatedAt = Date.now();
    return room;
  }

  public seek(code: string, currentTime: number): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.baseTime = Math.max(0, currentTime);
    room.lastUpdatedAt = Date.now();
    return room;
  }

  public changeVideo(code: string, video: Video): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.currentVideo = video;
    room.isPlaying = true;
    room.baseTime = 0;
    room.lastUpdatedAt = Date.now();
    return room;
  }

  public addToQueue(code: string, video: Video): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    // Limit queue to 50 items to prevent abuse
    if (room.queue.length < 50) {
      room.queue.push(video);
    }
    return room;
  }

  public removeFromQueue(code: string, index: number): RoomInternal | null {
    const room = this.getRoom(code);
    if (!room) return null;

    if (index >= 0 && index < room.queue.length) {
      room.queue.splice(index, 1);
    }
    return room;
  }

  public nextSong(
    code: string,
  ): { room: RoomInternal; changed: boolean } | null {
    const room = this.getRoom(code);
    if (!room) return null;

    if (room.queue.length > 0) {
      const next = room.queue.shift()!;
      room.currentVideo = next;
      room.isPlaying = true;
      room.baseTime = 0;
      room.lastUpdatedAt = Date.now();
      return { room, changed: true };
    } else {
      // Nothing in queue, stop
      room.isPlaying = false;
      return { room, changed: false };
    }
  }

  public addMessage(
    code: string,
    user: User,
    text: string,
  ): ChatMessage | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return null;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: user,
      text: trimmed,
      timestamp: Date.now(),
    };

    // Store up to 100 recent messages
    if (room.messages.length >= 100) {
      room.messages.shift();
    }
    room.messages.push(message);

    return message;
  }
}

export const roomManager = new RoomManager();
