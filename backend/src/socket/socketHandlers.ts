import { Server, Socket } from "socket.io";
import { roomManager } from "../rooms/roomManager";
import {
  PlayActionPayload,
  PauseActionPayload,
  SeekActionPayload,
  ChangeVideoPayload,
  QueueAddPayload,
  QueueRemovePayload,
  User,
} from "../types";

const ADJECTIVES = [
  "Sonic",
  "Cosmic",
  "Funky",
  "Groovy",
  "Neon",
  "Velvet",
  "Chill",
  "Electric",
  "Solar",
  "Astral",
];
const NOUNS = [
  "Panda",
  "Tiger",
  "Falcon",
  "Dolphin",
  "Otter",
  "Badger",
  "Fox",
  "Wolf",
  "Koala",
  "Phoenix",
];

function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    // 1. Create Room
    socket.on(
      "create-room",
      (payload: { nickname?: string } = {}, callback?: (res: any) => void) => {
        const nickname =
          payload?.nickname?.trim().slice(0, 30) || generateRandomNickname();
        const user: User = {
          socketId: socket.id,
          nickname,
        };

        const room = roomManager.createRoom(user);
        socket.join(room.code);

        const serialized = roomManager.serialize(room);
        socket.emit("room-state", serialized);

        if (typeof callback === "function") {
          callback({ success: true, room: serialized, user });
        }
      },
    );

    // 2. Join Room
    socket.on(
      "join-room",
      (
        payload: { roomCode: string; nickname?: string },
        callback?: (res: any) => void,
      ) => {
        const roomCode = payload?.roomCode?.trim().toUpperCase();
        if (!roomCode) {
          if (typeof callback === "function")
            callback({ success: false, error: "Room code is required" });
          return;
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Room not found. Please check the code.",
            });
          return;
        }

        const nickname =
          payload?.nickname?.trim().slice(0, 30) || generateRandomNickname();
        const user: User = {
          socketId: socket.id,
          nickname,
        };

        roomManager.joinRoom(roomCode, user);
        socket.join(roomCode);

        const serialized = roomManager.serialize(room);
        // Notify sender
        socket.emit("room-state", serialized);
        // Notify everyone in the room of updated state
        io.to(roomCode).emit("room-state", serialized);
        socket.to(roomCode).emit("user-joined", user);

        if (typeof callback === "function") {
          callback({ success: true, room: serialized, user });
        }
      },
    );

    // 3. Leave Room
    socket.on("leave-room", () => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        const { room, user } = result;
        socket.leave(room.code);
        const serialized = roomManager.serialize(room);
        io.to(room.code).emit("user-left", user);
        io.to(room.code).emit("room-state", serialized);
      }
    });

    // 4. Request current room state (e.g. on reconnect)
    socket.on("request-room-state", (payload: { roomCode: string }) => {
      const room = roomManager.getRoom(payload?.roomCode);
      if (room) {
        socket.emit("room-state", roomManager.serialize(room));
      }
    });

    // 5. Playback: Play
    socket.on("play", (payload: PlayActionPayload) => {
      const { roomCode, currentTime } = payload;
      const room = roomManager.play(roomCode, currentTime);
      if (room) {
        // Broadcast to other peers so they start playing
        socket.to(roomCode).emit("play", {
          currentTime: room.baseTime,
          lastUpdatedAt: room.lastUpdatedAt,
        });
        // Also emit state to keep all properties in sync
        io.to(roomCode).emit("room-state", roomManager.serialize(room));
      }
    });

    // 6. Playback: Pause
    socket.on("pause", (payload: PauseActionPayload) => {
      const { roomCode, currentTime } = payload;
      const room = roomManager.pause(roomCode, currentTime);
      if (room) {
        // Broadcast to other peers so they pause
        socket.to(roomCode).emit("pause", {
          currentTime: room.baseTime,
          lastUpdatedAt: room.lastUpdatedAt,
        });
        io.to(roomCode).emit("room-state", roomManager.serialize(room));
      }
    });

    // 7. Playback: Seek
    socket.on("seek", (payload: SeekActionPayload) => {
      const { roomCode, currentTime } = payload;
      const room = roomManager.seek(roomCode, currentTime);
      if (room) {
        // Broadcast seek to other peers
        socket.to(roomCode).emit("seek", {
          currentTime: room.baseTime,
          lastUpdatedAt: room.lastUpdatedAt,
          isPlaying: room.isPlaying,
        });
        io.to(roomCode).emit("room-state", roomManager.serialize(room));
      }
    });

    // 8. Change Video immediately
    socket.on("change-video", (payload: ChangeVideoPayload) => {
      const { roomCode, video } = payload;
      const room = roomManager.changeVideo(roomCode, video);
      if (room) {
        io.to(roomCode).emit("room-state", roomManager.serialize(room));
      }
    });

    // 9. Video Ended (server coordinates next track transition)
    socket.on("video-ended", (payload: { roomCode: string }) => {
      const { roomCode } = payload;
      const result = roomManager.nextSong(roomCode);
      if (result) {
        io.to(roomCode).emit("room-state", roomManager.serialize(result.room));
      }
    });

    // 10. Queue Add
    socket.on("queue-add", (payload: QueueAddPayload) => {
      const { roomCode, video } = payload;
      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      // If no video is currently active, set this as the active video immediately
      if (!room.currentVideo) {
        roomManager.changeVideo(roomCode, video);
      } else {
        roomManager.addToQueue(roomCode, video);
      }

      io.to(roomCode).emit("room-state", roomManager.serialize(room));
    });

    // 11. Queue Remove
    socket.on("queue-remove", (payload: QueueRemovePayload) => {
      const { roomCode, index } = payload;
      const room = roomManager.removeFromQueue(roomCode, index);
      if (room) {
        io.to(roomCode).emit("room-state", roomManager.serialize(room));
      }
    });

    // 12. Skip current track to next in queue
    socket.on("skip-track", (payload: { roomCode: string }) => {
      const { roomCode } = payload;
      const result = roomManager.nextSong(roomCode);
      if (result) {
        io.to(roomCode).emit("room-state", roomManager.serialize(result.room));
      }
    });

    // 13. Chat Message
    socket.on("chat-message", (payload: { roomCode: string; text: string }) => {
      const roomCode = payload?.roomCode?.trim().toUpperCase();
      const text = payload?.text;
      if (!roomCode || !text) return;

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (!user) return;

      const message = roomManager.addMessage(roomCode, user, text);
      if (message) {
        io.to(roomCode).emit("chat-message", message);
      }
    });

    // 14. Disconnect
    socket.on("disconnect", () => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        const { room, user } = result;
        const serialized = roomManager.serialize(room);
        io.to(room.code).emit("user-left", user);
        io.to(room.code).emit("room-state", serialized);
      }
    });
  });
}
