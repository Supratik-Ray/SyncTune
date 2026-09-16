import { io, Socket } from "socket.io-client";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/+$/, "");

export const socket: Socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
