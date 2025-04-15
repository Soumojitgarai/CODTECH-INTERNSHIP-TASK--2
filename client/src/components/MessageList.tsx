import { useRef, useEffect } from "react";
import { User, MessageWithUser } from "@shared/schema";
import { formatMessageTime, groupMessagesByDate } from "@/lib/utils";

interface MessageListProps {
  messages: MessageWithUser[];
  currentUser: User | null;
}

export default function MessageList({ messages, currentUser }: MessageListProps) {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const groupedMessages = groupMessagesByDate(messages);
  
  return (
    <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Day divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs font-medium text-gray-500">{date}</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>
          
          {/* Messages for this date */}
          {dateMessages.map((message) => (
            <div key={message.id} className="mb-4 message-animation">
              <div className="flex items-start">
                {message.user && (
                  <div className={`shrink-0 w-8 h-8 rounded-full ${
                    message.user.id === currentUser?.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  } flex items-center justify-center text-xs font-medium mr-2`}>
                    {message.user.initials || (message.user.username ? message.user.username.substring(0, 2).toUpperCase() : 'UN')}
                  </div>
                )}
                {!message.user && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium mr-2">
                    UN
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-baseline">
                    <span className="font-medium text-gray-900">{message.user ? message.user.username : 'Unknown User'}</span>
                    <span className="ml-2 text-xs text-gray-500">{formatMessageTime(message.timestamp)}</span>
                  </div>
                  <div className="mt-1 text-gray-800 text-sm">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <i className="fas fa-comments text-4xl mb-2"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      )}
    </div>
  );
}
