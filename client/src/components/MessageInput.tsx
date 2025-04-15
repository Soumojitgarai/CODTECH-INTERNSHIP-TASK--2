import { useState, useRef, KeyboardEvent } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      
      // Focus back on textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex items-end space-x-2">
        <div className="flex-1 min-h-[80px]">
          <div className={`bg-white border ${disabled ? 'border-gray-200 opacity-70' : 'border-gray-300'} rounded-lg px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}>
            <textarea
              ref={textareaRef}
              rows={3}
              className="block w-full resize-none border-0 bg-transparent p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
              placeholder={disabled ? "Reconnecting..." : "Type your message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            ></textarea>
            <div className="flex justify-between pt-2">
              <div className="flex space-x-2">
                <button className="text-gray-500 hover:text-gray-700" disabled={disabled}>
                  <i className="far fa-smile"></i>
                </button>
                <button className="text-gray-500 hover:text-gray-700" disabled={disabled}>
                  <i className="fas fa-paperclip"></i>
                </button>
                <button className="text-gray-500 hover:text-gray-700" disabled={disabled}>
                  <i className="fas fa-at"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          className={`inline-flex items-center justify-center rounded-md border border-transparent ${
            disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'
          } px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          onClick={handleSend}
          disabled={disabled || !message.trim()}
        >
          <span>Send</span>
          <i className="fas fa-paper-plane ml-1.5"></i>
        </button>
      </div>
    </div>
  );
}
