import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChannelHeader from "./ChannelHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import NotificationToast from "./NotificationToast";
import ConnectionAlert from "./ConnectionAlert";
import { useChat } from "@/hooks/useChat";
import { Channel, User, MessageWithUser } from "@shared/schema";

export default function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<number>(1); // Default to general channel
  
  const { 
    connected,
    channels,
    activeChannel,
    currentUser,
    channelMessages,
    onlineUsers,
    sendMessage,
    joinChannel,
    notification,
    closeNotification
  } = useChat(activeChannelId);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleChannelSelect = (channelId: number) => {
    setActiveChannelId(channelId);
    joinChannel(channelId);
  };
  
  useEffect(() => {
    // Handle responsive sidebar for mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-64 bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out md:relative absolute z-10`}
      >
        <Sidebar 
          channels={channels}
          activeChannelId={activeChannelId}
          onChannelSelect={handleChannelSelect}
          onlineUsers={onlineUsers}
          currentUser={currentUser}
          connected={connected}
          closeSidebar={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-white">
        <ChannelHeader 
          channel={activeChannel}
          openSidebar={() => setSidebarOpen(true)}
        />
        
        <MessageList 
          messages={channelMessages}
          currentUser={currentUser}
        />
        
        <MessageInput 
          onSendMessage={(content) => sendMessage(content, activeChannelId)}
          disabled={!connected}
        />
      </div>
      
      {/* Notification toast for new messages */}
      {notification && (
        <NotificationToast
          title={notification.username}
          message={notification.message}
          onClose={closeNotification}
        />
      )}
      
      {/* Connection alert */}
      {!connected && <ConnectionAlert />}
    </div>
  );
}
