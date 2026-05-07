import React from 'react';
import { useHistory } from 'react-router-dom';
import { RiChatSmile2Line } from 'react-icons/ri';
import swal from 'sweetalert';

const ChatButton = () => {
  const history = useHistory();

  const openConsultation = () => {
    swal({
      title: "Bạn muốn chat với ai?",
      text: "Chọn 1 trong 2 lựa chọn bên dưới",
      buttons: {
        cancel: "Chat với AI",
        doctor: {
          text: "Chat với bác sĩ",
          value: "doctor",
        },
      },
    }).then((value) => {
      if (value === "doctor") {
        history.push('/doctor-chat');
      } else {
        history.push('/consultation');
      }
    });
  };

  return (
    <button
      onClick={openConsultation}
      aria-label="Ask a pharmacist"
      className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center focus:outline-none"
    >
      <RiChatSmile2Line className="w-6 h-6" />
    </button>
  );
};

export default ChatButton;
