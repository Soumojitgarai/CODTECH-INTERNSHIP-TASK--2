import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MessageWithUser } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(timestamp: Date): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Invalid timestamp:', timestamp);
    return new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

export function formatDate(date: Date): string {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: now.getFullYear() !== messageDate.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Invalid date:', date);
    return 'Unknown Date';
  }
}

export function groupMessagesByDate(messages: MessageWithUser[]): Record<string, MessageWithUser[]> {
  const groups: Record<string, MessageWithUser[]> = {};
  
  if (!messages || !Array.isArray(messages)) {
    return groups; // Return empty groups if messages is not an array
  }
  
  for (const message of messages) {
    if (!message || !message.timestamp) {
      continue; // Skip invalid messages
    }
    
    try {
      const date = formatDate(new Date(message.timestamp));
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(message);
    } catch (error) {
      console.error('Error processing message:', message, error);
      // Skip this message if there's an error
    }
  }
  
  return groups;
}

export function generateRandomUsername(): string {
  const adjectives = ["Happy", "Quick", "Clever", "Brave", "Gentle", "Calm", "Wise", "Swift", "Bright", "Kind"];
  const nouns = ["Fox", "Bear", "Eagle", "Dolphin", "Lion", "Tiger", "Wolf", "Deer", "Hawk", "Rabbit"];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective}${noun}${number}`;
}

// Function to generate random color
export function getRandomColor(): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 
    'bg-pink-500', 'bg-teal-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
