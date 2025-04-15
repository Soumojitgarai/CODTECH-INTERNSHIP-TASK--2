import { useEffect } from "react";

interface NotificationToastProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function NotificationToast({ title, message, onClose }: NotificationToastProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [onClose]);
  
  return (
    <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center max-w-xs animate-fade-in">
      <div className="shrink-0 mr-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <i className="fas fa-envelope text-sm"></i>
        </div>
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-300 truncate">{message}</p>
      </div>
    </div>
  );
}
