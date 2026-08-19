/**
 * Real-Time Support Chat Socket Service
 * Manages WebSocket connections, room subscriptions, and real-time message broadcasting.
 */
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const activeRooms = new Map();

/**
 * Initialize WebSocket handlers on HTTP server
 */
function initSocketService(server) {
  let io;
  try {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: env.cors.origins,
        credentials: true,
      },
    });

    // JWT Authentication Handshake Middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.slice(7);
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      try {
        const decoded = jwt.verify(token, env.jwt.secret);
        socket.user = decoded;
        next();
      } catch {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`[WebSocket] Connected: User ${socket.user?.id || 'guest'} (${socket.id})`);

      // Join conversation room
      socket.on('join_room', (chatId) => {
        const roomName = `chat_${chatId}`;
        socket.join(roomName);
        console.log(`[WebSocket] User ${socket.id} joined room ${roomName}`);
      });

      // Send real-time chat message
      socket.on('send_message', (data) => {
        const { chatId, text, sender = 'admin' } = data;
        const message = {
          id: `m-${uuid().slice(0, 8)}`,
          chatId,
          text,
          sender,
          timestamp: new Date().toISOString(),
        };

        const roomName = `chat_${chatId}`;
        io.to(roomName).emit('new_message', message);
        console.log(`[WebSocket] Broadcasted message to ${roomName}: "${text.slice(0, 30)}..."`);
      });

      // Typing indicators
      socket.on('typing', (data) => {
        const { chatId, isTyping } = data;
        socket.to(`chat_${chatId}`).emit('user_typing', { chatId, isTyping, user: socket.user?.id });
      });

      socket.on('disconnect', () => {
        console.log(`[WebSocket] Disconnected: ${socket.id}`);
      });
    });

    console.log('[WebSocket Service] Socket.io server initialized');
  } catch (err) {
    console.log('[WebSocket Service Warning] socket.io not installed or running in HTTP fallback mode:', err.message);
  }

  return io;
}

module.exports = { initSocketService, activeRooms };
