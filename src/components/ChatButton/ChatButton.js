import React from 'react';
import { useHistory } from 'react-router-dom';
import { RiChatSmile2Line } from 'react-icons/ri';

const ChatButton = () => {
  const history = useHistory();

  const openConsultation = () => {
    history.push('/consultation');
  };

  return (
    <button
      onClick={openConsultation}
      aria-label="Chat với AI"
      className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center focus:outline-none"
    >
      <RiChatSmile2Line className="w-6 h-6" />
    </button>
  );
};

export default ChatButton;
