import { useState } from "react";
import { Channel, User } from "@shared/schema";

interface SidebarProps {
  channels: Channel[];
  activeChannelId: number;
  onChannelSelect: (channelId: number) => void;
  onlineUsers: User[];
  currentUser: User | null;
  connected: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({
  channels,
  activeChannelId,
  onChannelSelect,
  onlineUsers,
  currentUser,
  connected,
  closeSidebar,
}: SidebarProps) {
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  
  const handleChannelClick = (channelId: number) => {
    onChannelSelect(channelId);
    closeSidebar();
  };
  
  return (
    <>
      {/* App Logo and Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <i className="fas fa-comment-dots text-primary text-xl"></i>
          <h1 className="font-semibold text-lg text-gray-800">ChatApp</h1>
        </div>
        <div className="flex items-center">
          {/* Connection status indicator */}
          <span className="flex items-center text-sm mr-2">
            <span className={`w-2 h-2 ${connected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-1`}></span>
            <span className={connected ? 'text-green-500' : 'text-red-500'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </span>
          <button onClick={closeSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      {/* Channels section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs uppercase font-semibold text-gray-500 tracking-wide">Channels</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-sm"
            onClick={() => setIsCreatingChannel(!isCreatingChannel)}
            aria-label="Add channel"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
        
        {isCreatingChannel && (
          <div className="mb-2 flex">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-l-md text-sm py-1 px-2"
              placeholder="channel-name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
            <button
              className="bg-primary text-white rounded-r-md px-2 text-sm"
              onClick={() => {
                if (newChannelName.trim()) {
                  // TODO: Handle channel creation
                  setNewChannelName("");
                  setIsCreatingChannel(false);
                }
              }}
            >
              Add
            </button>
          </div>
        )}
        
        <div className="space-y-1 custom-scrollbar overflow-y-auto max-h-40">
          {channels.map((channel) => (
            <button
              key={channel.id}
              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-sm font-medium transition-colors ${
                activeChannelId === channel.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleChannelClick(channel.id)}
            >
              <div className="flex items-center">
                <span className="mr-1.5">#</span>
                <span>{channel.name}</span>
              </div>
              {/* Unread count would go here */}
            </button>
          ))}
        </div>
      </div>
      
      {/* Online Users section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs uppercase font-semibold text-gray-500 tracking-wide">Online Users</h2>
        </div>
        
        <div className="space-y-1 custom-scrollbar overflow-y-auto max-h-64">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              className="w-full flex items-center justify-between py-1.5 px-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="relative flex shrink-0 mr-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 ring-1 ring-white"></span>
                  <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {user.initials || user.username.substring(0, 2).toUpperCase()}
                  </span>
                </span>
                <span>{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* User profile section */}
      {currentUser && (
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
              <span>{currentUser.initials || currentUser.username.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="ml-2 flex-1">
              <div className="text-sm font-medium text-gray-700">{currentUser.username}</div>
              <div className="text-xs text-gray-500 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
