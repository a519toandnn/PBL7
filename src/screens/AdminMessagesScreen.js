import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const AdminMessagesScreen = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Check if admin
  useEffect(() => {
    if (user.role !== 'ADMIN') {
      history.push('/');
      return;
    }
    loadAllMessages();
  }, [user.role]);

  const loadAllMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/doctor/messages/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const payload = json.data || json;
      setAllMessages(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
    setLoading(false);
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText) return;

    try {
      const res = await fetch(
        `${apiBase}/doctor/message/${selectedMessage.id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ doctorReply: replyText })
        }
      );

      const json = await res.json();
      const updated = json.data || json;

      // Update message in list
      setAllMessages(allMessages.map(m => m.id === updated.id ? updated : m));
      setSelectedMessage(updated);
      setReplyText('');
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const unrepliedCount = allMessages.filter(m => !m.doctorReply).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Quản Lý Tin Nhắn Bệnh Nhân</h1>
        <p className="text-gray-600 mb-6">
          Chỉ quản lý viên mới có thể xem và trả lời. Bệnh nhân không thể thấy trang này.
        </p>
        {loading && <p className="text-sm text-gray-500 mb-4">Đang tải dữ liệu...</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-600">Tổng Tin Nhắn</h3>
            <p className="text-3xl font-bold text-blue-600">{allMessages.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-600">Chưa Trả Lời</h3>
            <p className="text-3xl font-bold text-red-600">{unrepliedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-600">Đã Trả Lời</h3>
            <p className="text-3xl font-bold text-green-600">{allMessages.length - unrepliedCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Tin Nhắn</h2>
            </div>
            <div className="h-96 overflow-y-auto">
              {allMessages.length === 0 ? (
                <div className="p-4 text-gray-400">Không có tin nhắn nào</div>
              ) : (
                allMessages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                      selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                    } ${!msg.doctorReply ? 'bg-yellow-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 truncate">{msg.userId}</p>
                        <p className="text-sm text-gray-600 truncate">{msg.message.substring(0, 50)}...</p>
                        <small className="text-gray-400">
                          {new Date(msg.createdAt).toLocaleString()}
                        </small>
                      </div>
                      {!msg.doctorReply && (
                        <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                          Mới
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail & Reply */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            {!selectedMessage ? (
              <div className="text-center text-gray-400 py-12">
                Chọn một tin nhắn để xem chi tiết
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tin Nhắn Từ Bệnh Nhân</h3>

                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Bệnh Nhân ID:</strong> {selectedMessage.userId}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Gửi lúc:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                    <p className="text-gray-900">{selectedMessage.message}</p>
                    {selectedMessage.imagePath && (
                      <img
                        src={selectedMessage.imagePath}
                        alt="patient-image"
                        className="mt-3 max-w-xs rounded"
                      />
                    )}
                  </div>

                  {/* Doctor Reply */}
                  {selectedMessage.doctorReply && (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <p className="font-bold text-green-700 mb-2">✓ Phản Hồi Của Bác Sĩ:</p>
                      <p className="text-gray-900">{selectedMessage.doctorReply}</p>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                {!selectedMessage.doctorReply && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Trả Lời Bệnh Nhân</h3>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập phản hồi từ bác sĩ..."
                      className="w-full p-3 border rounded mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows="5"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyText}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Gửi Phản Hồi
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesScreen;
