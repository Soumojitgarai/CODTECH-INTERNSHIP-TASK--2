import { Channel } from "@shared/schema";

interface ChannelHeaderProps {
  channel: Channel | null;
  openSidebar: () => void;
}

export default function ChannelHeader({ channel, openSidebar }: ChannelHeaderProps) {
  return (
    <div className="border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={openSidebar} className="md:hidden mr-2 text-gray-500 hover:text-gray-700">
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h2 className="font-semibold text-gray-800 flex items-center">
            <span className="mr-1 text-gray-600">#</span>
            <span>{channel?.name || 'Loading...'}</span>
          </h2>
          <p className="text-xs text-gray-500">{channel?.description || 'No description'}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="text-gray-500 hover:text-gray-700">
          <i className="fas fa-user-plus"></i>
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <i className="fas fa-info-circle"></i>
        </button>
      </div>
    </div>
  );
}
