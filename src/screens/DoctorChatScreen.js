import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const DoctorChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Load patient's messages from backend
  useEffect(() => {
    if (!user.id) {
      history.push('/signin');
      return;
    }
    loadMessages();

    // Poll so patient can see admin/doctor replies without refreshing
    const interval = setInterval(() => {
      loadMessages();
    }, 4000);

    return () => clearInterval(interval);
  }, [user.id]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`${apiBase}/doctor/messages/patient/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const payload = json.data || json;
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async (e) => {
    e && e.preventDefault();
    if (!message && !file) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('message', message);
      fd.append('userId', user.id);
      if (file) fd.append('image', file, file.name);

      const res = await fetch(`${apiBase}/doctor/message`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json();
      const newMsg = json.data || json;
      setMessages([...messages, newMsg]);
      setMessage('');
      setFile(null);
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tư Vấn Bác Sĩ</h1>
        <p className="text-gray-600 mb-8">Chat trực tiếp với các bác sĩ của chúng tôi</p>

        {/* Messages Container */}
        <div className="bg-white rounded-lg shadow-lg p-6 h-96 overflow-y-auto mb-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              Chưa có tin nhắn nào. Hãy bắt đầu cuộc hội thoại!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-4">
                {/* Patient message */}
                <div className="flex justify-end mb-2">
                  <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                    <p>{msg.message}</p>
                    {msg.imagePath && (
                      <img src={msg.imagePath} alt="patient-upload" className="mt-2 max-w-xs rounded" />
                    )}
                    <small className="text-blue-200">{new Date(msg.createdAt).toLocaleTimeString()}</small>
                  </div>
                </div>

                {/* Doctor reply */}
                {msg.doctorReply && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs">
                      <p className="font-bold text-green-700 mb-1">Bác Sĩ:</p>
                      <p>{msg.doctorReply}</p>
                    </div>
                  </div>
                )}
                {!msg.doctorReply && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg max-w-xs text-sm">
                      Đang chờ phản hồi từ bác sĩ...
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="bg-white rounded-lg shadow-lg p-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập câu hỏi hoặc mô tả triệu chứng của bạn..."
            className="w-full p-3 border rounded mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="flex-1"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-blue-900 text-sm">
            💡 <strong>Lưu ý:</strong> Bác sĩ sẽ trả lời câu hỏi của bạn trong thời gian làm việc (7:00 AM - 10:00 PM)
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorChatScreen;
