const DEFAULT_AI_CONSULTATION_URL =
  'https://unominously-hexangular-corrinne.ngrok-free.dev/extract_prescription';

export const ACCEPTED_PRESCRIPTION_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/gif',
];

const getAiConsultationUrl = () =>
  process.env.REACT_APP_AI_CONSULTATION_URL || DEFAULT_AI_CONSULTATION_URL;

export const analyzePrescriptionImage = async (imageFile) => {
  if (!imageFile) {
    throw new Error('Vui lòng chọn ảnh đơn thuốc trước khi gửi.');
  }

  const formData = new FormData();
  formData.append('image', imageFile, imageFile.name);

  const response = await fetch(getAiConsultationUrl(), {
    method: 'POST',
    body: formData,
  });

  let json;

  try {
    json = await response.json();
  } catch (error) {
    throw new Error('AI endpoint không trả về JSON hợp lệ.');
  }

  if (!response.ok) {
    throw new Error(
      json?.message || json?.error || 'AI endpoint xử lý ảnh thất bại.'
    );
  }

  return json;
};
