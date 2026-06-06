# Bao cao kiem tra noi API FE

Ngay kiem tra: 2026-05-31

Nguon doi chieu: `D:\PBL7\src\API_DOCUMENTATION.md` va code BE trong `D:\PBL7\src\modules`.

Pham vi: ra soat FE trong `D:\PBL7-FE\src`.

Trang thai hien tai: da sua cac muc admin order/statistics, checkout, cart persistence, admin product CRUD, profile, search backend, shipping address va import prescription. Cac muc duoi day dang tam bo qua vi hien chua dung doctor message.

## Nguyen tac chinh sua

- Dung dung stack FE hien tai: React 17, JavaScript `.js`, React hooks, `fetch`, `sweetalert`, `react-router-dom` v5.
- Khong doi FE route neu route do chi la route UI. API call ben trong phai goi dung endpoint BE.
- Khi sua can doi chieu controller/DTO/service BE, khong tu them endpoint khong co trong BE hoac API documentation.
- Moi muc se duoc sua rieng khi duoc yeu cau, sua xong thi xoa khoi file nay.

## 1. Admin reply doctor message dang replace message bang partial response

### Noi API sai

- File: `src\screens\AdminMessagesScreen.js`
- API `POST /doctor/message/:messageId/reply` tra ve response partial, vi du `{ id, doctorReply }`.
- FE dang dung object partial nay de thay toan bo message trong list, lam mat cac field nhu `userId`, `message`, `createdAt`, `imageUrl`.

### Doan code noi sai

```js
const json = await res.json();
const updated = json.data || json;

setAllMessages(allMessages.map(m => m.id === updated.id ? updated : m));
setSelectedMessage(updated);
```

### Phuong an chinh sua

Merge response partial vao message cu, khong replace nguyen object.

### Code cua phuong an chinh sua

```js
const json = await res.json();
if (!res.ok) {
  throw new Error(json.message || 'reply_failed');
}

const updated = json.data || json;
setAllMessages((prev) =>
  prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
);
setSelectedMessage((prev) => (prev ? { ...prev, ...updated } : updated));
setReplyText('');
```

---

## 2. Doctor message image dung sai field response

### Noi API sai

- File: `src\screens\DoctorChatScreen.js`
- File: `src\screens\AdminMessagesScreen.js`
- API doctor message tra field anh la `imageUrl`.
- FE dang render `imagePath`, nen anh upload tu backend khong hien thi dung.

### Doan code noi sai

```js
{msg.imagePath && (
  <img src={msg.imagePath} alt="patient-upload" className="mt-2 max-w-xs rounded" />
)}
```

```js
{selectedMessage.imagePath && (
  <img
    src={selectedMessage.imagePath}
    alt="patient-image"
    className="mt-3 max-w-xs rounded"
  />
)}
```

### Phuong an chinh sua

Dung `imageUrl`. Neu backend tra path tuong doi `/uploads/...`, prefix bang API base hien tai.

### Code cua phuong an chinh sua

```js
const resolveApiAsset = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
};
```

```jsx
{msg.imageUrl && (
  <img
    src={resolveApiAsset(msg.imageUrl)}
    alt="patient-upload"
    className="mt-2 max-w-xs rounded"
  />
)}
```

```jsx
{selectedMessage.imageUrl && (
  <img
    src={resolveApiAsset(selectedMessage.imageUrl)}
    alt="patient"
    className="mt-3 max-w-xs rounded"
  />
)}
```

---

## Muc dang tam bo qua

1. Doctor message reply/image: muc 1, 2.
