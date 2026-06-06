import {
  ACCEPTED_PRESCRIPTION_IMAGE_TYPES,
  analyzePrescriptionImage,
} from './consultationAiApi';

describe('consultationAiApi', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('sends the prescription image to the AI endpoint as FormData', async () => {
    const file = new File(['demo'], 'prescription.jpg', { type: 'image/jpeg' });
    const payload = { medicines: [{ name: 'Demo medicine' }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    });

    const result = await analyzePrescriptionImage(file);

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://unominously-hexangular-corrinne.ngrok-free.dev/extract_prescription',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );
    const submittedImage = global.fetch.mock.calls[0][1].body.get('image');
    expect(submittedImage.name).toBe('prescription.jpg');
    expect(submittedImage.type).toBe('image/jpeg');
  });

  it('documents the image MIME types accepted by the AI endpoint', () => {
    expect(ACCEPTED_PRESCRIPTION_IMAGE_TYPES).toEqual([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/gif',
    ]);
  });

  it('throws a readable error when the AI endpoint does not return JSON', async () => {
    const file = new File(['demo'], 'prescription.png', { type: 'image/png' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    });

    await expect(analyzePrescriptionImage(file)).rejects.toThrow(
      'AI endpoint không trả về JSON hợp lệ.'
    );
  });
});
