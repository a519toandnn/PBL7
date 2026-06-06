# Báo cáo rà soát tiếng Việt không dấu

Phạm vi quét: các file trong repo FE, loại trừ `node_modules`, `build`, `.git`, `backups`, asset ảnh và file lock/generated.

Ghi chú: một số dòng là slug hoặc key kỹ thuật như `thuoc`, `thuc-pham-chuc-nang`; các dòng này được ghi lại để bạn quyết định có cần sửa text hiển thị hay giữ nguyên vì là dữ liệu kỹ thuật.

## 1. Code UI nên ưu tiên sửa

### `src/components/Order/OrderCard.js`

- Dòng 31: `Khong cap nhat duoc gio hang`
- Dòng 39: `Khong xoa duoc san pham khoi gio hang`

### `src/components/products/Product.js`

- Dòng 38: `Khong them duoc san pham vao gio hang`
- Dòng 44: `Thong bao`
- Dòng 44: `San pham chua co slug de xem chi tiet`

### `src/screens/ConsultationScreen.js`

- Dòng 250: `Anh khong duoc vuot qua 10MB.`
- Dòng 262: `Vui long chon anh don thuoc truoc khi gui.`
- Dòng 267: `Vui long dang nhap de them don thuoc vao gio hang.`
- Dòng 273: `Phien dang nhap khong hop le. Vui long dang nhap lai de them don thuoc vao gio hang.`
- Dòng 294: `Backend bao Unauthorized. Phien dang nhap da het han hoac token khong hop le, vui long dang nhap lai.`
- Dòng 298: `Khong the xu ly anh. Vui long thu lai.`
- Dòng 388: `Ket qua them don thuoc vao gio hang`
- Dòng 391: `Da them ... dong thuoc hop le.`
- Dòng 399: `Xem gio hang`
- Dòng 411: `San pham`
- Dòng 414: `So luong`
- Dòng 437: `Khong the them dong thuoc nay vao cart.`
- Dòng 442: `Khong ro ten thuoc`

### `src/screens/OrderManagementScreen.js`

- Dòng 9: `(khong co)`
- Dòng 12: `Nguoi nhan`
- Dòng 13: `So dien thoai`
- Dòng 14: `Dia chi`
- Dòng 18: `Khong co`
- Dòng 119: `(khong co)`

### `src/screens/OrderScreen.js`

- Dòng 99: `(khong co)`

### `src/screens/ProductDetailScreen.js`

- Dòng 45: `Khong tai duoc chi tiet thuoc`
- Dòng 53: `Khong tai duoc chi tiet thuoc`
- Dòng 99: `San pham`
- Dòng 144: `San pham da duoc them vao gio hang`
- Dòng 146: `Khong them duoc san pham vao gio hang`
- Dòng 172: `Khong tim thay san pham`
- Dòng 174: `Thong tin thuoc dang khong kha dung.`
- Dòng 178: `Quay lai danh sach thuoc`
- Dòng 189: `Quay lai`

### `src/screens/ProductsScreen.js`

- Dòng 25: `thuoc`, `thuc-pham-chuc-nang`
- Dòng 54: `thuoc`

Ghi chú: hai dòng này có thể là slug/key category, không nhất thiết phải sửa nếu không hiển thị trực tiếp cho user.

### `src/utils/consultationAiApi.js`

- Dòng 19: `Vui long chon anh don thuoc truoc khi gui.`
- Dòng 35: `AI endpoint khong tra ve JSON hop le.`

### `src/utils/consultationAiApi.test.js`

- Dòng 57: `AI endpoint khong tra ve JSON hop le.`

## 2. Tài liệu `.md` đang viết tiếng Việt không dấu

### `API_CONNECTION_AUDIT.md`

- Dòng 9: `Trang thai hien tai...`
- Dòng 11: `Nguyen tac chinh sua`
- Dòng 14: `Khong doi FE route...`
- Dòng 15: `Khi sua can doi chieu...`
- Dòng 16: `Moi muc se duoc sua rieng...`
- Dòng 36: `Phuong an chinh sua`
- Dòng 38: `khong replace nguyen object`
- Dòng 40: `Code cua phuong an chinh sua`
- Dòng 65: `anh upload tu backend khong hien thi dung`
- Dòng 85: `Phuong an chinh sua`
- Dòng 89: `Code cua phuong an chinh sua`

### `BE_CART_ITEM_DELETE_ENDPOINT_NOTE.md`

- Dòng 1: `De xuat BE: xoa cart item theo cart_item_id`
- Dòng 12: `Khi user checkout mot so item...`
- Dòng 20: `Vi vay FE se don gian...`
- Dòng 24: `endpoint xoa cart item cho user hien tai`
- Dòng 38: `Trong cartitem.controller.ts co endpoint`
- Dòng 47: `Nhung controller nay dang co guard`
- Dòng 53: `user thuong khong dung duoc`
- Dòng 55: `Vi sao endpoint hien tai co the duoc thiet ke nhu vay`
- Dòng 57: `Entity CartItem dang co unique constraint`
- Dòng 69: `Viec xoa theo productId + measureUnitId...`
- Dòng 71: `Tuy nhien voi FE...`
- Dòng 91: `Service khong nen xoa...`
- Dòng 132: `FE checkout xong co the xoa item...`
- Dòng 134: `Khong can FE giu logic...`
- Dòng 136: `Endpoint cu... co the giu lai...`
- Dòng 140: `Hien tai POST /order/checkout...`
- Dòng 142: `Neu BE muon lam dung hon...`
- Dòng 148: `Va khong can goi them API...`
- Dòng 150: `Day co le la phuong an sach nhat...`

### `CONSULTATION_AI_FLOW_DESIGN.md`

- Dòng 5: `nguoi dung tai anh don thuoc...`
- Dòng 44: `Khong set thu cong Content-Type...`
- Dòng 56: `Files du kien se sua khi duoc duyet`
- Dòng 58: `Neu ban dong y implement...`
- Dòng 64: `Khong sua`
- Dòng 80: `Neu khong them env...`
- Dòng 111: `Vui long chon anh don thuoc truoc khi gui.`
- Dòng 127: `AI endpoint khong tra ve JSON hop le.`
- Dòng 142: `khong bi nhieu logic API`
- Dòng 143: `De sau nay them buoc...`
- Dòng 169: `Handler chon anh`
- Dòng 196: `Anh khong duoc vuot qua 10MB.`
- Dòng 225: `FE se khong chi check chung chung...`
- Dòng 256: `Vui long chon anh don thuoc truoc khi gui.`
- Dòng 268: `Khong the xu ly anh. Vui long thu lai.`
- Dòng 291: `Tai anh don thuoc`
- Dòng 309: `Anh da chon`
- Dòng 312: `Don thuoc da tai len`
- Dòng 330: `Dang xu ly...`, `Gui`
- Dòng 353: `sau khi ghep lai se co dang nay`
- Dòng 398: `Anh khong duoc vuot qua 10MB.`
- Dòng 410: `Vui long chon anh don thuoc truoc khi gui.`
- Dòng 422: `Khong the xu ly anh. Vui long thu lai.`
- Dòng 459: `User chon anh don thuoc`
- Dòng 462: `Button chuyen sang Dang xu ly...`
- Dòng 471: `FE dung tai day, khong goi BE`
- Dòng 475: `Sau nay, khi ban co route BE...`
- Dòng 481: `hien tai se khong them buoc nay...`
- Dòng 483: `Ghi chu can xac nhan truoc khi implement`
- Dòng 497: `Con lai design khong can doi`

### `PRODUCT_DETAIL_IMPLEMENTATION_DRAFT.md`

File này gần như toàn bộ đang viết tiếng Việt không dấu. Các đoạn nổi bật:

- Dòng 1: `Bao cao thay doi trang chi tiet thuoc`
- Dòng 5: `Pham vi...`
- Dòng 9: `Da luu snapshot truoc khi sua...`
- Dòng 24-30: nhiều dòng `Co`, `Da`, `khong`
- Dòng 35-41: nhiều dòng `Khong sua`, `Anh san pham...`
- Dòng 49-60: nhiều dòng `Nut View`, `Trang detail...`
- Dòng 68-98: nhiều dòng mô tả behavior trang detail không dấu
- Dòng 104-154: nhiều dòng mô tả component không dấu
- Dòng 161-190: nhiều dòng helper và file không sửa không dấu
- Dòng 205-216: nhiều dòng expected result không dấu
- Dòng 232-246: nhiều dòng verification/rollback không dấu

## 3. Ghi chú thêm

- Các file `.md` phần lớn là tài liệu nội bộ. Nếu bạn chỉ muốn sửa text hiển thị cho user trước, nên ưu tiên nhóm `Code UI nên ưu tiên sửa`.
- Một số chuỗi đang nằm trong test hoặc helper có thể không hiển thị trực tiếp, nhưng vẫn được ghi lại để thống nhất ngôn ngữ.
- Báo cáo này không tự sửa code, chỉ liệt kê để bạn duyệt và chọn phần muốn sửa.
