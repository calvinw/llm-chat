import React from 'react';

const ChatHeader = () => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Empty header - hamburger menu moved to sidebar */}
        <div className="flex-1"></div>
      </div>
    </div>
  );
};

export default ChatHeader;