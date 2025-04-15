import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/lib/websocket";
import { Channel, User, MessageWithUser } from "@shared/schema";
import { generateRandomUsername } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  username: string;
  message: string;
}

export function useChat(activeChannelId: number) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [channelMessages, setChannelMessages] = useState<MessageWithUser[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const { socket, connected, sendMessage: sendSocketMessage } = useWebSocket();
  
  // Fetch channels
  const { data: fetchedChannels } = useQuery({
    queryKey: ['/api/channels'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch users
  const { data: fetchedUsers } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch messages for active channel
  const { data: fetchedMessages } = useQuery({
    queryKey: ['/api/channels', activeChannelId, 'messages'],
    enabled: !!activeChannelId,
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string }) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      localStorage.setItem('chatUser', JSON.stringify(data));
      
      // Connect to WebSocket with the user
      if (socket && connected) {
        sendSocketMessage({
          type: 'CONNECT',
          payload: {
            userId: data.id,
            username: data.username
          }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
  
  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (channelData: { name: string, description: string }) => {
      const response = await apiRequest('POST', '/api/channels', channelData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
    }
  });
  
  // Initialize user on first load
  useEffect(() => {
    const storedUser = localStorage.getItem('chatUser');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        initializeNewUser();
      }
    } else {
      initializeNewUser();
    }
  }, []);
  
  const initializeNewUser = () => {
    const username = generateRandomUsername();
    createUserMutation.mutate({ username });
  };
  
  // Update channels when data is fetched
  useEffect(() => {
    if (fetchedChannels) {
      setChannels(fetchedChannels);
      
      // Set active channel
      const channel = fetchedChannels.find((c: Channel) => c.id === activeChannelId);
      if (channel) {
        setActiveChannel(channel);
      } else if (fetchedChannels.length > 0) {
        setActiveChannel(fetchedChannels[0]);
      }
    }
  }, [fetchedChannels, activeChannelId]);
  
  // Update online users when users data is fetched
  useEffect(() => {
    if (fetchedUsers) {
      setOnlineUsers(fetchedUsers.filter((user: User) => user.onlineStatus));
    }
  }, [fetchedUsers]);
  
  // Update messages when data is fetched
  useEffect(() => {
    if (fetchedMessages) {
      setChannelMessages(fetchedMessages);
    }
  }, [fetchedMessages]);
  
  // Connect to WebSocket when socket and user are available
  useEffect(() => {
    if (socket && connected && currentUser) {
      sendSocketMessage({
        type: 'CONNECT',
        payload: {
          userId: currentUser.id,
          username: currentUser.username
        }
      });
    }
  }, [socket, connected, currentUser]);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!socket) return;
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'CHAT_MESSAGE':
            // If message is for active channel, refresh messages
            if (data.payload.channelId === activeChannelId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/channels', activeChannelId, 'messages'] 
              });
            }
            
            // Show notification for new message if not from current user
            if (currentUser && data.payload.userId !== currentUser.id) {
              setNotification({
                username: data.payload.username,
                message: data.payload.message
              });
            }
            break;
            
          case 'USER_JOINED':
          case 'USER_LEFT':
            // Refresh users list
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            break;
            
          case 'CHANNEL_JOINED':
            // Refresh channels list
            queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, activeChannelId, currentUser, queryClient]);
  
  // Send a chat message
  const sendChatMessage = useCallback((content: string, channelId: number) => {
    if (!connected || !currentUser) return;
    
    sendSocketMessage({
      type: 'CHAT_MESSAGE',
      payload: {
        content,
        userId: currentUser.id,
        channelId
      }
    });
  }, [connected, currentUser, sendSocketMessage]);
  
  // Join a channel
  const joinChannel = useCallback((channelId: number) => {
    if (!connected || !currentUser) return;
    
    sendSocketMessage({
      type: 'CHANNEL_JOINED',
      payload: {
        channelId,
        userId: currentUser.id
      }
    });
  }, [connected, currentUser, sendSocketMessage]);
  
  // Create a new channel
  const createChannel = useCallback((name: string, description: string = "") => {
    createChannelMutation.mutate({ name, description });
  }, [createChannelMutation]);
  
  // Close notification
  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);
  
  return {
    connected,
    channels,
    activeChannel,
    currentUser,
    channelMessages,
    onlineUsers,
    sendMessage: sendChatMessage,
    joinChannel,
    createChannel,
    notification,
    closeNotification
  };
}
