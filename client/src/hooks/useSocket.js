import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

/**
 * Singleton socket instance — lives for the lifetime of the app.
 * This prevents multiple connections when the hook is used in different components.
 */
let socketInstance = null;
let connectionAttempted = false;

function getSocket() {
  return socketInstance;
}

/**
 * Hook to manage a Socket.io connection.
 * Call this once at the app level (e.g., in ChannelsPage) or per component.
 * The socket is a singleton — multiple hook calls share one connection.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const messageHandlersRef = useRef([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    // Reuse existing connection if already established
    if (socketInstance && socketInstance.connected) {
      setConnected(true);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
      setConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    // Central new_message dispatcher — calls all registered handlers
    socket.on('new_message', (msg) => {
      messageHandlersRef.current.forEach(handler => handler(msg));
    });

    // Cleanup only on full unmount (not on channel change)
    return () => {
      // Don't disconnect here — socket should persist across page navigations
      // Disconnect only when user logs out (handled in logout flow)
    };
  }, []); // run once on mount

  const joinChannel = useCallback((channelId) => {
    socketInstance?.emit('join_channel', channelId);
  }, []);

  const leaveChannel = useCallback((channelId) => {
    socketInstance?.emit('leave_channel', channelId);
  }, []);

  const sendMessage = useCallback((channelId, content) => {
    socketInstance?.emit('send_message', { channelId, content });
  }, []);

  /**
   * Register a handler for incoming messages.
   * Returns a cleanup function to remove the handler.
   */
  const onMessage = useCallback((handler) => {
    messageHandlersRef.current.push(handler);
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
    };
  }, []);

  /**
   * Disconnect the socket (call on logout).
   */
  const disconnect = useCallback(() => {
    socketInstance?.disconnect();
    socketInstance = null;
    setConnected(false);
  }, []);

  return { connected, joinChannel, leaveChannel, sendMessage, onMessage, disconnect };
}
