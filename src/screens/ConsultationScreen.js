import React, { useState } from 'react';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';

const ConsultationScreen = () => {
  const [expandedId, setExpandedId] = useState(null);

  const healthConditions = [
    {
      id: 1,
      title: "Cảm lạnh & Cứng cơ",
      symptoms: "Sốt, đau đầu, đau gáy, mệt mỏi, viêm họng",
      medicines: "Paracetamol, Ibuprofen, siro ho",
      advice: "Nghỉ ngơi đủ, uống nước ấm, tránh thức khuya, bổ sung Vitamin C",
      duration: "Thường khỏi trong 5-7 ngày",
      whenToSeeDoctor: "Nếu sốt trên 39°C hoặc kéo dài trên 7 ngày"
    },
    {
      id: 2,
      title: "Viêm mũi dị ứng",
      symptoms: "Sổ mũi, hắt hơi, ngứa mũi, ngứa mắt",
      medicines: "Cetirizine, Loratadine, xịt mũi",
      advice: "Tránh tiếp xúc với chất gây dị ứng, rửa mũi bằng nước muối",
      duration: "Triệu chứng giảm sau 20-30 phút uống thuốc",
      whenToSeeDoctor: "Nếu triệu chứng không cải thiện sau 3-5 ngày"
    },
    {
      id: 3,
      title: "Đau đầu & Chóng mặt",
      symptoms: "Nhức đầu, cảm giác xoay, buồn nôn",
      medicines: "Paracetamol, Ibuprofen, keo propolis",
      advice: "Nằm trong phòng tối mát, uống nước đủ, thư giãn",
      duration: "Thường cải thiện sau 30-60 phút",
      whenToSeeDoctor: "Đau đầu kèm sốt cao, rối loạn thị lực, hoặc liên tục"
    },
    {
      id: 4,
      title: "Đau bụng kinh & Kinh nguyệt không đều",
      symptoms: "Đau bụng, đau lưng dưới, khó chịu",
      medicines: "Ibuprofen, viên bổ sung sắt, vitamin",
      advice: "Chườm ấm vùng bụng, uống nước ấm, tránh stress",
      duration: "Thường cải thiện sau 1-2 ngày",
      whenToSeeDoctor: "Đau quá mức bình thường hoặc kéo dài trên 5 ngày"
    },
    {
      id: 5,
      title: "Mệt mỏi & Suy nhược cơ thể",
      symptoms: "Cảm giác luôn mệt, yếu, khó tập trung",
      medicines: "Vitamin tổng hợp, B12, sắt + Vitamin C",
      advice: "Ngủ đủ 7-8 tiếng, tập thể dục nhẹ, ăn dinh dưỡng đầy đủ",
      duration: "Cải thiện sau 1-2 tuần uống liên tục",
      whenToSeeDoctor: "Nếu mệt mỏi kéo dài trên 2 tuần mà không cải thiện"
    },
    {
      id: 6,
      title: "Da khô & Nứt nẻ",
      symptoms: "Da sần sùi, ngứa, đỏ, nứt nẻ",
      medicines: "Kem dưỡng da, kem trị viêm da",
      advice: "Rửa mặt bằng nước ấm, dùng kem dưỡng, cấp ẩm hàng ngày",
      duration: "Cải thiện sau 3-5 ngày sử dụng đều đặn",
      whenToSeeDoctor: "Nếu tình trạng trầm trọng hoặc không cải thiện"
    },
    {
      id: 7,
      title: "Mụn & Mụn ẩn",
      symptoms: "Mụn mủ, mụn đầu đen, mụn ẩn, sưng đỏ",
      medicines: "Kem trị mụn, dung dịch rửa mặt chuyên dụng",
      advice: "Rửa mặt 2 lần/ngày, tránh ăn dầu mỡ, giữ sạch vùng mặt",
      duration: "Cải thiện sau 1-2 tuần",
      whenToSeeDoctor: "Mụn nghiêm trọng hoặc không cải thiện sau 3 tuần"
    },
    {
      id: 8,
      title: "Ho & Viêm họng",
      symptoms: "Ho liên tục, độn họng, khó nuốt",
      medicines: "Siro ho, keo propolis + mật ong, viên ngậm họng",
      advice: "Uống nước ấm, tránh khí nóng lạnh, bôi mật ong tự nhiên",
      duration: "Cải thiện sau 3-5 ngày",
      whenToSeeDoctor: "Ho kéo dài trên 2 tuần hoặc ho ra máu"
    },
    {
      id: 9,
      title: "Miễn dịch suy yếu & Cảm lạnh thường xuyên",
      symptoms: "Dễ bị bệnh, cảm lạnh liên tục",
      medicines: "Vitamin D3, Vitamin C, Keo propolis, viên tổng hợp",
      advice: "Tập thể dục, ngủ đủ, ăn rau quả, tránh stress",
      duration: "Cải thiện sau 1-2 tháng bổ sung đều đặn",
      whenToSeeDoctor: "Cảm lạnh quá 2 lần/tháng trong thời gian dài"
    },
    {
      id: 10,
      title: "Tiêu chảy & Các vấn đề tiêu hóa",
      symptoms: "Đi ngoài nhiều, phân lỏng, đau bụng",
      medicines: "Men vi sinh, thuốc giảm tiêu chảy, oresol",
      advice: "Uống nước ấm, ăn cơm nhẹ, tránh đồ ăn cay",
      duration: "Cải thiện sau 2-3 ngày",
      whenToSeeDoctor: "Tiêu chảy kéo dài trên 5 ngày hoặc có máu"
    }
  ];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tư Vấn Tình Hình Sức Khỏe</h1>
          <p className="text-gray-600 text-lg">
            Tìm hiểu về các tình trạng sức khỏe phổ biến, triệu chứng, thuốc phù hợp và lời khuyên
          </p>
        </div>

        {/* Health Conditions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {healthConditions.map((condition) => (
            <div
              key={condition.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300"
            >
              <button
                onClick={() => toggleExpand(condition.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">{condition.title}</h3>
                {expandedId === condition.id ? (
                  <AiOutlineMinus className="text-2xl text-red-500" />
                ) : (
                  <AiOutlinePlus className="text-2xl text-blue-500" />
                )}
              </button>

              {expandedId === condition.id && (
                <div className="px-6 pb-6 border-t border-gray-200 pt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">📋 Triệu chứng:</h4>
                    <p className="text-gray-600">{condition.symptoms}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">💊 Thuốc khuyên dùng:</h4>
                    <p className="text-gray-600">{condition.medicines}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">💡 Lời khuyên:</h4>
                    <p className="text-gray-600">{condition.advice}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">⏱️ Thời gian:</h4>
                      <p className="text-gray-600 text-sm">{condition.duration}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">🏥 Khi nào gặp bác sĩ:</h4>
                      <p className="text-gray-600 text-sm">{condition.whenToSeeDoctor}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                    <p className="text-blue-800 text-sm">
                      ⚠️ <strong>Lưu ý:</strong> Thông tin này chỉ mang tính chất tư vấn. Vui lòng gặp bác sĩ nếu tình trạng không cải thiện hoặc trầm trọng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important Note */}
        <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">📞 Cần khám chuyên khoa?</h3>
          <p className="text-yellow-800">
            Nếu bạn có bất kỳ triệu chứng nặng ngoài những tình huống nêu trên hoặc tình trạng không cải thiện trong thời gian nêu, 
            vui lòng liên hệ với điều dưỡng viên hoặc bác sĩ của chúng tôi để được tư vấn chi tiết.
          </p>
        </div>
        {/* Ask a Pharmacist */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📝 Hỏi Dược Sĩ</h3>
          <p className="text-gray-600 mb-4">Gửi câu hỏi của bạn, dược sĩ sẽ trả lời (demo: phản hồi mô phỏng).</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target;
            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const question = form.question.value.trim();
            if (!name || !email || !question) {
              return alert('Vui lòng điền đầy đủ thông tin');
            }
            const saved = JSON.parse(localStorage.getItem('consultationQuestions') || '[]');
            saved.push({ id: Date.now(), name, email, question, date: new Date().toISOString() });
            localStorage.setItem('consultationQuestions', JSON.stringify(saved));
            form.reset();
            alert('Câu hỏi của bạn đã được gửi (demo). Dược sĩ sẽ phản hồi sớm.');
          }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input name="name" placeholder="Họ và tên" className="px-4 py-3 border rounded" />
              <input name="email" placeholder="Email" className="px-4 py-3 border rounded" />
              <input name="phone" placeholder="Số điện thoại (tùy chọn)" className="px-4 py-3 border rounded" />
            </div>
            <div className="mb-4">
              <textarea name="question" rows="4" placeholder="Mô tả triệu chứng hoặc câu hỏi" className="w-full px-4 py-3 border rounded" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded">Gửi câu hỏi</button>
              <button type="button" onClick={() => { localStorage.removeItem('consultationQuestions'); alert('Demo: Đã xóa câu hỏi demo'); }} className="bg-gray-200 px-6 py-3 rounded">Xóa demo</button>
            </div>
          </form>
        </div>

        {/* Chatbot */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">💬 Chat với bot tư vấn</h3>
          <ChatBox />
        </div>
      </div>
    </div>
  );
};

export default ConsultationScreen;

function ChatBox() {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const apiBase = process.env.REACT_APP_API_BASE || '';

  const send = async (e) => {
    e && e.preventDefault();
    if (!message && !file) return;

    const userMsg = { id: Date.now(), who: 'user', text: message, image: file ? URL.createObjectURL(file) : null };
    setMessages((m) => [...m, userMsg]);
    setMessage('');
    setFile(null);

    try {
      const fd = new FormData();
      fd.append('message', userMsg.text || '');
      if (file) fd.append('image', file, file.name);

      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      const payload = json && json.data ? json.data : json;
      const botMsg = { id: Date.now() + 1, who: 'bot', text: payload?.reply || 'Đã nhận', image: payload?.imageUrl || null };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      const errMsg = { id: Date.now() + 2, who: 'bot', text: 'Lỗi kết nối tới server.' };
      setMessages((m) => [...m, errMsg]);
    }
  };

  return (
    <div>
      <div className="border rounded p-4 h-64 overflow-auto mb-4 bg-gray-50">
        {messages.length === 0 && <div className="text-gray-500">Chưa có cuộc hội thoại nào. Hãy bắt đầu bằng một câu hỏi.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`mb-3 ${m.who === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded ${m.who === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <div>{m.text}</div>
              {m.image && (
                <img src={m.image} alt="upload" className="mt-2 max-w-xs rounded" />
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex flex-col gap-2">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nhập câu hỏi của bạn..." className="w-full p-3 border rounded" />
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
          <button type="submit" className="ml-auto bg-blue-600 text-white px-6 py-2 rounded">Gửi</button>
        </div>
      </form>
    </div>
  );
}
