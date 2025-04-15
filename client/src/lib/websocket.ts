import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { ChatMessage } from "@shared/schema";

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  sendMessage: () => {},
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log("WebSocket connected successfully");
        setConnected(true);
      };
      
      newSocket.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed WebSocket message:", data);
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };
      
      newSocket.onclose = (event) => {
        console.log("WebSocket disconnected with code:", event.code, "reason:", event.reason);
        setConnected(false);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          connectWebSocket();
        }, 5000); // Increased timeout to 5 seconds
      };
      
      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };
      
      setSocket(newSocket);
      
      return newSocket;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      return null;
    }
  }, []);
  
  // Connect WebSocket on mount
  useEffect(() => {
    const newSocket = connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [connectWebSocket]);
  
  // Function to send messages
  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message:", message);
      const messageString = JSON.stringify(message);
      socket.send(messageString);
      console.log("Message sent:", messageString);
    } else {
      console.warn("WebSocket not connected, can't send message. Socket state:", 
        socket ? ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][socket.readyState] : "null");
    }
  }, [socket]);
  
  // Create the context value object
  const contextValue: WebSocketContextType = {
    socket,
    connected,
    sendMessage
  };
  
  // Return the provider with children
  return React.createElement(
    WebSocketContext.Provider,
    { value: contextValue },
    children
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
