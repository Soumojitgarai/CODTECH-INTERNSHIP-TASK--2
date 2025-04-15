export default function ConnectionAlert() {
  return (
    <div className="fixed top-4 right-1/2 transform translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center">
        <i className="fas fa-exclamation-circle mr-2"></i>
        <span>Connection lost. Attempting to reconnect...</span>
      </div>
    </div>
  );
}
