# Consultation AI Image Flow - Design Code

## Muc tieu

Trang `/consultation` se cho nguoi dung tai anh don thuoc len, bam gui, FE gui anh do den AI endpoint rieng cua ban, nhan ket qua JSON tra ve va dung lai tai do.

Chua gui JSON nay ve BE vi route BE ban se lam sau.

## AI endpoint se dung

Domain AI:

```text
https://unominously-hexangular-corrinne.ngrok-free.dev
```

Endpoint:

```text
extract_prescription
```

URL day du de FE goi:

```text
https://unominously-hexangular-corrinne.ngrok-free.dev/extract_prescription
```

Request de xuat:

```http
POST https://unominously-hexangular-corrinne.ngrok-free.dev/extract_prescription
Content-Type: multipart/form-data
```

Body de xuat:

```text
image: File
```

Luu y:

- Khong set thu cong `Content-Type` khi dung `FormData`.
- Browser se tu them multipart boundary.
- Field anh giu la `image`, vi code consultation hien tai cung dang append anh bang key nay.
- Endpoint AI cua ban nhan cac dinh dang:
  - `image/jpeg` -> `.jpg`
  - `image/jpg` -> `.jpg`
  - `image/png` -> `.png`
  - `image/webp` -> `.webp`
  - `image/bmp` -> `.bmp`
  - `image/tiff` -> `.tiff`
  - `image/gif` -> `.gif`

## Files du kien se sua khi duoc duyet

Neu ban dong y implement, minh se sua/toi uu theo huong nay:

- `src/screens/ConsultationScreen.js`
- Them moi `src/utils/consultationAiApi.js`
- Them env vao `.env` neu ban muon cau hinh bang bien moi

Khong sua:

- `DoctorChatScreen.js`
- `AdminMessagesScreen.js`
- `AdminConsultationsScreen.js`
- BE route nhan JSON sau nay
- Logic luu database

## Bien moi de cau hinh endpoint

De clean code va de doi domain ngrok nhanh, nen them vao `.env`:

```env
REACT_APP_AI_CONSULTATION_URL=https://unominously-hexangular-corrinne.ngrok-free.dev/extract_prescription
```

Neu khong them env, code co the fallback truc tiep ve URL tren. Nhung cach tot hon la dung env de khi ngrok doi link thi chi sua `.env`.

## Helper API de xuat

File moi:

```text
src/utils/consultationAiApi.js
```

Code de xuat:

```js
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
    throw new Error('Vui long chon anh don thuoc truoc khi gui.');
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
    throw new Error('AI endpoint khong tra ve JSON hop le.');
  }

  if (!response.ok) {
    throw new Error(
      json?.message || json?.error || 'AI endpoint xu ly anh that bai.'
    );
  }

  return json;
};
```

Ly do tach helper:

- `ConsultationScreen.js` khong bi nhieu logic API.
- De sau nay them buoc gui JSON sang BE thi khong lam roi UI.
- De test/debug endpoint de hon.

## State de xuat trong `ChatBox`

Thay vi luu messages kieu chat voi `/chat`, flow moi can cac state ro rang hon:

```js
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const acceptedImageInputTypes = ACCEPTED_PRESCRIPTION_IMAGE_TYPES.join(',');

const [file, setFile] = useState(null);
const [previewUrl, setPreviewUrl] = useState('');
const [aiResult, setAiResult] = useState(null);
const [aiError, setAiError] = useState('');
const [isAnalyzing, setIsAnalyzing] = useState(false);
```

Y nghia:

- `file`: file anh that de gui len AI.
- `previewUrl`: anh preview tren UI.
- `aiResult`: JSON AI tra ve.
- `aiError`: loi hien thi cho user.
- `isAnalyzing`: loading state khi dang gui anh.

## Handler chon anh

Code de xuat:

```js
const handleFileChange = (event) => {
  const selectedFile = event.target.files?.[0];

  setAiError('');
  setAiResult(null);

  if (!selectedFile) {
    setFile(null);
    setPreviewUrl('');
    return;
  }

  if (!ACCEPTED_PRESCRIPTION_IMAGE_TYPES.includes(selectedFile.type)) {
    setFile(null);
    setPreviewUrl('');
    setAiError('Chi chap nhan anh JPG, PNG, WEBP, BMP, TIFF hoac GIF.');
    return;
  }

  if (selectedFile.size > MAX_IMAGE_SIZE) {
    setFile(null);
    setPreviewUrl('');
    setAiError('Anh khong duoc vuot qua 10MB.');
    return;
  }

  setFile(selectedFile);
  setPreviewUrl(URL.createObjectURL(selectedFile));
};
```

Can them cleanup de tranh ro ri bo nho:

```js
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```

Khi implement that, `useEffect` se duoc import them:

```js
import React, { useEffect, useState } from 'react';
```

## Dinh dang anh duoc phep

FE se khong chi check chung chung `image/*`. FE se dung dung danh sach MIME type ma endpoint AI cua ban nhan:

```js
const acceptedImageInputTypes = ACCEPTED_PRESCRIPTION_IMAGE_TYPES.join(',');
```

Gia tri nay se duoc truyen vao input file:

```jsx
<input
  type="file"
  accept={acceptedImageInputTypes}
  onChange={handleFileChange}
/>
```

Validation se chi cho phep:

```text
JPG, PNG, WEBP, BMP, TIFF, GIF
```

## Handler gui anh den AI

Code de xuat:

```js
const send = async (event) => {
  event.preventDefault();

  if (!file) {
    setAiError('Vui long chon anh don thuoc truoc khi gui.');
    return;
  }

  setIsAnalyzing(true);
  setAiError('');
  setAiResult(null);

  try {
    const result = await analyzePrescriptionImage(file);
    setAiResult(result);
  } catch (error) {
    setAiError(error.message || 'Khong the xu ly anh. Vui long thu lai.');
  } finally {
    setIsAnalyzing(false);
  }
};
```

Diem dung dung yeu cau:

- Goi AI endpoint.
- Nhan JSON.
- Luu JSON vao `aiResult`.
- Hien thi JSON tren FE.
- Chua gui JSON sang BE.

## UI de xuat cho form upload

Code de xuat thay cho UI chat upload hien tai trong `ChatBox`:

```jsx
<form onSubmit={send} className="space-y-4">
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 bg-gray-50">
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      Tai anh don thuoc
    </label>

    <input
      type="file"
      accept={acceptedImageInputTypes}
      onChange={handleFileChange}
      disabled={isAnalyzing}
      className="block w-full text-sm text-gray-700"
    />

    <p className="mt-2 text-xs text-gray-500">
      Chap nhan anh JPG, PNG, WEBP, BMP, TIFF, GIF. Dung luong toi da 10MB.
    </p>
  </div>

  {previewUrl && (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-gray-800">Anh da chon</p>
      <img
        src={previewUrl}
        alt="Don thuoc da tai len"
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
      {isAnalyzing ? 'Dang xu ly...' : 'Gui'}
    </button>
  </div>

  {aiResult && (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Ket qua AI tra ve
        </h3>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          JSON da nhan
        </span>
      </div>

      <pre className="max-h-96 overflow-auto rounded-md bg-gray-900 p-4 text-xs leading-6 text-green-100">
        {JSON.stringify(aiResult, null, 2)}
      </pre>
    </div>
  )}
</form>
```

## `ChatBox` sau khi ghep lai se co dang nay

Day la code proposal, chua implement vao file that:

```js
function ChatBox() {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const acceptedImageInputTypes = ACCEPTED_PRESCRIPTION_IMAGE_TYPES.join(',');

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setAiError('');
    setAiResult(null);

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl('');
      return;
    }

    if (!ACCEPTED_PRESCRIPTION_IMAGE_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setPreviewUrl('');
      setAiError('Chi chap nhan anh JPG, PNG, WEBP, BMP, TIFF hoac GIF.');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      setFile(null);
      setPreviewUrl('');
      setAiError('Anh khong duoc vuot qua 10MB.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const send = async (event) => {
    event.preventDefault();

    if (!file) {
      setAiError('Vui long chon anh don thuoc truoc khi gui.');
      return;
    }

    setIsAnalyzing(true);
    setAiError('');
    setAiResult(null);

    try {
      const result = await analyzePrescriptionImage(file);
      setAiResult(result);
    } catch (error) {
      setAiError(error.message || 'Khong the xu ly anh. Vui long thu lai.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-4">
      {/* upload, preview, error, button, json result UI */}
    </form>
  );
}
```

## Import se thay doi

Trong `src/screens/ConsultationScreen.js`, import se doi tu:

```js
import React, { useState } from 'react';
```

Thanh:

```js
import React, { useEffect, useState } from 'react';
import {
  ACCEPTED_PRESCRIPTION_IMAGE_TYPES,
  analyzePrescriptionImage,
} from '../utils/consultationAiApi';
```

## Ket qua du kien sau khi implement

User flow:

1. User vao `/consultation`.
2. User chon anh don thuoc.
3. FE hien preview anh.
4. User bam `Gui`.
5. Button chuyen sang `Dang xu ly...` va bi disable.
6. FE gui `POST multipart/form-data` den:

```text
https://unominously-hexangular-corrinne.ngrok-free.dev/extract_prescription
```

7. AI tra JSON.
8. FE hien JSON trong khung ket qua.
9. FE dung tai day, khong goi BE.

## Phan se lam sau, khi BE route san sang

Sau nay, khi ban co route BE nhan JSON, co the them buoc:

```js
await submitPrescriptionExtractionResult(aiResult);
```

Nhung hien tai se khong them buoc nay de dung dung yeu cau cua ban.

## Ghi chu can xac nhan truoc khi implement

Minh dang gia dinh AI endpoint nhan anh voi field:

```text
image
```

Neu endpoint `extract_prescription` cua ban nhan field la `file`, minh se doi duy nhat dong nay:

```js
formData.append('file', imageFile, imageFile.name);
```

Con lai design khong can doi.
