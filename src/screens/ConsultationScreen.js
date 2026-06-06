import React, { useEffect, useState } from 'react';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { useHistory } from 'react-router-dom';
import {
  ACCEPTED_PRESCRIPTION_IMAGE_TYPES,
  analyzePrescriptionImage,
} from '../utils/consultationAiApi';
import useAuth from '../hooks/useAuth';
import useOrder from '../hooks/useOrder';
import { apiFetch, getAuthHeaders } from '../utils/apiClient';
import { formatCurrency } from '../utils/productsApi';

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
            Chat với AI để được tư vấn nhanh về tình trạng sức khỏe và thuốc phù hợp
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chat với AI</h2>
          <ChatBox />
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
        
      </div>
    </div>
  );
};

export default ConsultationScreen;

function ChatBox() {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const acceptedImageInputTypes = ACCEPTED_PRESCRIPTION_IMAGE_TYPES.join(',');
  const history = useHistory();
  const { user } = useAuth();
  const { loadCart } = useOrder();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [aiError, setAiError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = () => {
    setPreviewUrl('');
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setAiError('');
    setAiResult(null);
    setImportResult(null);
    clearPreview();

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ACCEPTED_PRESCRIPTION_IMAGE_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setAiError('Chỉ chấp nhận ảnh JPG, PNG, WEBP, BMP, TIFF hoặc GIF.');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      setFile(null);
      setAiError('Ảnh không được vượt quá 10MB.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const send = async (event) => {
    event.preventDefault();

    if (!file) {
      setAiError('Vui lòng chọn ảnh đơn thuốc trước khi gửi.');
      return;
    }

    if (!user?.id) {
      setAiError('Vui lòng đăng nhập để thêm đơn thuốc vào giỏ hàng.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      setAiError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại để thêm đơn thuốc vào giỏ hàng.');
      return;
    }

    setIsAnalyzing(true);
    setAiError('');
    setAiResult(null);
    setImportResult(null);

    try {
      const result = await analyzePrescriptionImage(file);
      setAiResult(result);
      const imported = await apiFetch('/cart/import-prescription', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(result),
      });
      setImportResult(imported);
      await loadCart();
    } catch (err) {
      if (err.status === 401) {
        setAiError('Backend bao Unauthorized. Phiên đăng nhập đã hết hạn hoặc token không hợp lệ, vui lòng đăng nhập lại.');
        return;
      }

      setAiError(err.message || 'Không thể xử lý ảnh. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 bg-gray-50">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Tải ảnh đơn thuốc
        </label>

        <input
          type="file"
          accept={acceptedImageInputTypes}
          onChange={handleFileChange}
          disabled={isAnalyzing}
          className="block w-full text-sm text-gray-700"
        />

        <p className="mt-2 text-xs text-gray-500">
          Chấp nhận ảnh JPG, PNG, WEBP, BMP, TIFF, GIF. Dung lượng tối đa 10MB.
        </p>
      </div>

      {previewUrl && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">Ảnh đã chọn</p>
          <img
            src={previewUrl}
            alt="Đơn thuốc đã tải lên"
            className="max-h-80 w-full object-contain rounded-md bg-gray-100"
          />
        </div>
      )}

      {aiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {aiError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!file || isAnalyzing}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isAnalyzing ? 'Đang xử lý...' : 'Gửi'}
        </button>
      </div>

      {importResult && (
        <PrescriptionImportResult
          result={importResult}
          onViewCart={() => history.push('/orders')}
        />
      )}

      {aiResult && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Kết quả AI trả về
            </h3>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              JSON đã nhận
            </span>
          </div>

          <pre className="max-h-96 overflow-auto rounded-md bg-gray-900 p-4 text-xs leading-6 text-green-100">
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        </div>
      )}
    </form>
  );
}

function PrescriptionImportResult({ result, onViewCart }) {
  const matchedItems = Array.isArray(result?.matched_items) ? result.matched_items : [];
  const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
  const summary = result?.summary || {};

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-blue-950">
            Kết quả thêm đơn thuốc vào giỏ hàng
          </h3>
          <p className="mt-1 text-sm text-blue-800">
            Đã thêm {summary.cart_upsert_count || 0}/{summary.requested_count || 0} đơn thuốc hợp lệ.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewCart}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Xem giỏ hàng
        </button>
      </div>

      {matchedItems.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-blue-950">Đã thêm vào giỏ hàng</h4>
          {matchedItems.map((item, index) => {
            const cartItem = item.cart_item || {};
            return (
              <div key={`${cartItem.cart_item_id || index}`} className="rounded-md bg-white p-3 text-sm">
                <div className="font-semibold text-gray-900">
                  {cartItem.product?.name || item.match?.matched_product_name || 'San pham'}
                </div>
                <div className="mt-1 text-gray-600">
                  Số lượng: {cartItem.quantity || 0}
                  {cartItem.measure_unit?.name ? ` ${cartItem.measure_unit.name}` : ''}
                  {' - '}
                  Đơn giá: {formatCurrency(cartItem.unit_price || 0)}
                </div>
                {item.match?.match_type && (
                  <div className="mt-1 text-xs text-gray-500">
                    Khớp: {item.match.match_type}
                    {item.match.score !== undefined ? `, score ${item.match.score}` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-yellow-900">Cần xem lại</h4>
          {warnings.map((warning, index) => (
            <div key={`${warning.type || 'warning'}-${index}`} className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <div className="font-semibold">{warning.type || 'WARNING'}</div>
              <div className="mt-1">{warning.message || 'Không thể thêm đơn thuốc này vào giỏ hàng.'}</div>
              {Array.isArray(warning.inputs) && warning.inputs.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {warning.inputs.map((input, inputIndex) => (
                    <li key={inputIndex}>
                      {input.ten_thuoc || 'Không rõ tên thuốc'}
                      {input.so_luong ? ` - SL ${input.so_luong}` : ''}
                      {input.don_vi_tinh ? ` ${input.don_vi_tinh}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
