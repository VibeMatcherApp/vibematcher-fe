import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;
  chatId: string;
  messageId?: string;
}

interface TypingState {
  user: string;
  isTyping: boolean;
}

export function useChat(chatId: string | undefined, userWallet: string | undefined) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatId) return;

    socketRef.current = socket;

    // Join the chat room
    socket.emit('join_chat', chatId);

    // Listen for typing indicators
    const handleTyping = (data: TypingState) => {
      if (data.user !== userWallet) {
        setIsOtherTyping(data.isTyping);
        if (data.isTyping) {
          // Auto-clear typing after 3 seconds
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      }
    };

    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, userWallet]);

  const onNewMessage = useCallback((callback: (msg: ChatMessage) => void) => {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.on('new_message', callback);
    return () => {
      socket.off('new_message', callback);
    };
  }, []);

  const sendSocketMessage = useCallback((content: string) => {
    const socket = getSocket();
    if (!socket || !chatId || !userWallet) return;

    socket.emit('send_message', {
      chatId,
      sender: userWallet,
      content,
    });
  }, [chatId, userWallet]);

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !chatId) return;
    socket.emit('typing', { chatId });
  }, [chatId]);

  const emitStopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !chatId) return;
    socket.emit('stop_typing', { chatId });
  }, [chatId]);

  return {
    isOtherTyping,
    onNewMessage,
    sendSocketMessage,
    emitTyping,
    emitStopTyping,
  };
}

export function useOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOnline = (wallet: string) => {
      setOnlineUsers((prev) => new Set(prev).add(wallet));
    };

    const handleOffline = (wallet: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(wallet);
        return next;
      });
    };

    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    return () => {
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
    };
  }, []);

  return onlineUsers;
}
