import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket: Socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
