import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../services/socket";
import {
  RoomState,
  User,
  Video,
  ConnectionStatus,
  ChatMessage,
} from "../types";

export function useRoom() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    socket.connected ? "connected" : "disconnected",
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomCodeRef = useRef<string | null>(null);
  roomCodeRef.current = roomState?.code || null;

  // Clear transient notification after 4s
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, []);

  useEffect(() => {
    function onConnect() {
      setConnectionStatus("connected");
      if (roomCodeRef.current) {
        socket.emit("request-room-state", { roomCode: roomCodeRef.current });
      }
    }

    function onDisconnect() {
      setConnectionStatus("disconnected");
    }

    function onReconnectAttempt() {
      setConnectionStatus("reconnecting");
    }

    function onRoomState(state: RoomState) {
      setRoomState(state);
      if (state.messages) {
        setMessages(state.messages);
      }
      setError(null);
    }

    function onChatMessage(message: ChatMessage) {
      setMessages((prev) => [...prev, message]);
    }

    function onUserJoined(user: User) {
      showNotification(`${user.nickname} joined the room`);
    }

    function onUserLeft(user: User) {
      showNotification(`${user.nickname} left the room`);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("room-state", onRoomState);
    socket.on("chat-message", onChatMessage);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("room-state", onRoomState);
      socket.off("chat-message", onChatMessage);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
    };
  }, [showNotification]);

  const createRoom = useCallback(
    (nickname?: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        setError(null);
        socket.emit("create-room", { nickname }, (res: any) => {
          if (res?.success) {
            setRoomState(res.room);
            setCurrentUser(res.user);
            resolve({ success: true });
          } else {
            setError(res?.error || "Failed to create room");
            resolve({ success: false, error: res?.error });
          }
        });
      });
    },
    [],
  );

  const joinRoom = useCallback(
    (
      roomCode: string,
      nickname?: string,
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        setError(null);
        socket.emit("join-room", { roomCode, nickname }, (res: any) => {
          if (res?.success) {
            setRoomState(res.room);
            setCurrentUser(res.user);
            resolve({ success: true });
          } else {
            setError(res?.error || "Failed to join room");
            resolve({ success: false, error: res?.error });
          }
        });
      });
    },
    [],
  );

  const leaveRoom = useCallback(() => {
    socket.emit("leave-room");
    setRoomState(null);
    setCurrentUser(null);
  }, []);

  const play = useCallback((currentTime: number) => {
    if (!roomCodeRef.current) return;
    socket.emit("play", { roomCode: roomCodeRef.current, currentTime });
  }, []);

  const pause = useCallback((currentTime: number) => {
    if (!roomCodeRef.current) return;
    socket.emit("pause", { roomCode: roomCodeRef.current, currentTime });
  }, []);

  const seek = useCallback((currentTime: number) => {
    if (!roomCodeRef.current) return;
    socket.emit("seek", { roomCode: roomCodeRef.current, currentTime });
  }, []);

  const changeVideo = useCallback((video: Video) => {
    if (!roomCodeRef.current) return;
    socket.emit("change-video", { roomCode: roomCodeRef.current, video });
  }, []);

  const addToQueue = useCallback((video: Video) => {
    if (!roomCodeRef.current) return;
    socket.emit("queue-add", { roomCode: roomCodeRef.current, video });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    if (!roomCodeRef.current) return;
    socket.emit("queue-remove", { roomCode: roomCodeRef.current, index });
  }, []);

  const skipTrack = useCallback(() => {
    if (!roomCodeRef.current) return;
    socket.emit("skip-track", { roomCode: roomCodeRef.current });
  }, []);

  const onVideoEnded = useCallback(() => {
    if (!roomCodeRef.current) return;
    socket.emit("video-ended", { roomCode: roomCodeRef.current });
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!roomCodeRef.current || !text.trim()) return;
    socket.emit("chat-message", {
      roomCode: roomCodeRef.current,
      text: text.trim(),
    });
  }, []);

  return {
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
  };
}
