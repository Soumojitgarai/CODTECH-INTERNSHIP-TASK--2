import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { messageTypeSchema, type ChatMessage, type MessageType } from "@shared/schema";
import { z } from "zod";

// Keep track of connected clients
interface Client {
  id: number;
  socket: WebSocket;
  username: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const clients = new Map<number, Client>();
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // API routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  app.get('/api/channels', async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch channels' });
    }
  });
  
  app.get('/api/channels/:channelId/messages', async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ message: 'Invalid channel ID' });
      }
      
      const messages = await storage.getMessagesByChannel(channelId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });
  
  app.post('/api/channels', async (req, res) => {
    try {
      const channelData = req.body;
      const channel = await storage.createChannel(channelData);
      res.status(201).json(channel);
      
      // Broadcast new channel to all clients
      broadcastToAll({
        type: "CHANNEL_JOINED",
        payload: {
          channelId: channel.id,
          message: `Channel ${channel.name} was created`
        }
      });
      
    } catch (error) {
      res.status(500).json({ message: 'Failed to create channel' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Calculate initials if not provided
      if (!userData.initials) {
        userData.initials = userData.username.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
      }
      
      // Generate a random color if not provided
      if (!userData.color) {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];
        userData.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
      
      // Broadcast new user to all clients
      broadcastToAll({
        type: "USER_JOINED",
        payload: {
          userId: user.id,
          username: user.username,
          message: `${user.username} joined the chat`
        }
      });
      
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  // WebSocket handling
  wss.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Validate message format
        const validationResult = messageTypeSchema.safeParse(message.type);
        if (!validationResult.success) {
          sendError(socket, 'Invalid message format');
          return;
        }
        
        const type = message.type as MessageType;
        
        switch (type) {
          case 'CONNECT':
            await handleConnect(socket, message);
            break;
          case 'CHAT_MESSAGE':
            await handleChatMessage(message);
            break;
          case 'CHANNEL_JOINED':
            await handleChannelJoined(message);
            break;
          case 'TYPING':
            await handleTyping(message);
            break;
          default:
            console.log(`Unhandled message type: ${type}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        sendError(socket, 'Failed to process message');
      }
    });
    
    socket.on('close', () => {
      // Find and remove the client
      for (const [userId, client] of clients.entries()) {
        if (client.socket === socket) {
          clients.delete(userId);
          
          // Update user's online status
          storage.updateUserOnlineStatus(userId, false)
            .then(user => {
              if (user) {
                broadcastToAll({
                  type: 'USER_LEFT',
                  payload: {
                    userId: user.id,
                    username: user.username,
                    message: `${user.username} left the chat`
                  }
                });
              }
            })
            .catch(err => console.error('Error updating user status:', err));
          
          break;
        }
      }
      
      console.log('Client disconnected');
    });
  });
  
  // WebSocket message handlers
  async function handleConnect(socket: WebSocket, message: any): Promise<void> {
    const { userId, username } = message.payload;
    
    if (!userId || !username) {
      sendError(socket, 'Invalid connection data. userId and username are required.');
      return;
    }
    
    // Get or create the user
    let user = await storage.getUser(userId);
    
    if (!user) {
      // Create new user if doesn't exist
      try {
        user = await storage.createUser({
          username,
          password: 'defaultPassword', // In a real app, you'd handle this differently
          initials: username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
          color: 'bg-blue-500' // Default color
        });
      } catch (error) {
        sendError(socket, 'Failed to create user');
        return;
      }
    } else {
      // Update existing user's online status
      user = await storage.updateUserOnlineStatus(userId, true) || user;
    }
    
    // Register client
    clients.set(user.id, { id: user.id, socket, username: user.username });
    
    // Send existing channels and users to the new client
    const channels = await storage.getAllChannels();
    const users = await storage.getAllUsers();
    
    send(socket, {
      type: 'CONNECT',
      payload: {
        message: 'Connected successfully',
        userId: user.id
      }
    });
    
    // Broadcast user's online status to all other clients
    broadcastToAll({
      type: 'USER_JOINED',
      payload: {
        userId: user.id,
        username: user.username,
        message: `${user.username} is now online`
      }
    }, user.id);
  }
  
  async function handleChatMessage(message: any): Promise<void> {
    const { content, userId, channelId } = message.payload;
    
    if (!content || !userId || !channelId) {
      return;
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return;
      }
      
      const channel = await storage.getChannel(channelId);
      if (!channel) {
        return;
      }
      
      // Store the message
      const newMessage = await storage.createMessage({
        content,
        userId,
        channelId
      });
      
      // Broadcast the message to all connected clients
      broadcastToAll({
        type: 'CHAT_MESSAGE',
        payload: {
          message: content,
          userId: user.id,
          username: user.username,
          channelId,
          timestamp: newMessage.timestamp.toISOString()
        }
      });
      
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }
  
  async function handleChannelJoined(message: any): Promise<void> {
    const { channelId, userId } = message.payload;
    
    if (!channelId || !userId) {
      return;
    }
    
    try {
      const user = await storage.getUser(userId);
      const channel = await storage.getChannel(channelId);
      
      if (!user || !channel) {
        return;
      }
      
      // Broadcast to all clients
      broadcastToAll({
        type: 'CHANNEL_JOINED',
        payload: {
          channelId,
          userId: user.id,
          username: user.username,
          message: `${user.username} joined #${channel.name}`
        }
      });
      
    } catch (error) {
      console.error('Error handling channel joined:', error);
    }
  }
  
  async function handleTyping(message: any): Promise<void> {
    const { channelId, userId } = message.payload;
    
    if (!channelId || !userId) {
      return;
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return;
      }
      
      // Broadcast typing indicator to all clients
      broadcastToAll({
        type: 'TYPING',
        payload: {
          channelId,
          userId: user.id,
          username: user.username
        }
      });
      
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  }
  
  // Utility functions
  function send(socket: WebSocket, message: ChatMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
  
  function sendError(socket: WebSocket, errorMessage: string): void {
    send(socket, {
      type: 'ERROR',
      payload: {
        message: errorMessage
      }
    });
  }
  
  function broadcastToAll(message: ChatMessage, excludeUserId?: number): void {
    for (const [userId, client] of clients.entries()) {
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }
      
      send(client.socket, message);
    }
  }
  
  return httpServer;
}
