# Đề xuất redesign trang chi tiết thuốc

Ngày viết: 2026-06-01

Phạm vi: chỉ đề xuất thiết kế và hướng triển khai cho `src/screens/ProductDetailScreen.js`. Chưa sửa code trang chi tiết thuốc.

## Mục tiêu

Thiết kế lại trang chi tiết thuốc theo tinh thần chuyên nghiệp, rõ thông tin và dễ mua giống trải nghiệm nhà thuốc lớn, nhưng không copy 1:1 giao diện Long Châu. Giao diện mới sẽ giữ màu xanh chủ đạo và style hiện có của website, đồng thời bổ sung đủ thông tin từ API chi tiết thuốc.

## Vấn đề hiện tại

Trang `ProductDetailScreen.js` hiện lấy thuốc từ `useFetch('products')`, tức dữ liệu đã được map từ danh sách `GET /medicines`. Dữ liệu này chỉ có các field rút gọn như:

- `title`
- `image`
- `description`
- `price`
- `rating`
- `reviews`
- `category`
- `usage`
- `slug`

Trong khi API chi tiết `GET /medicines/:slug` có thêm dữ liệu quan trọng:

- `medical_info.usage`
- `medical_info.dosage`
- `medical_info.adverse_effect`
- `medical_info.careful`
- `medical_info.preservation`
- `prices`
- `categories`
- `product_type`
- `is_active`

Vì vậy trang hiện tại chỉ giống product card phóng to, chưa giống trang chi tiết thuốc thật.

## Hướng thiết kế đề xuất

### Approach A: Redesign gọn trong một file

Giữ mọi logic trong `ProductDetailScreen.js`, fetch thêm `/medicines/:slug`, rồi render lại layout.

Ưu điểm:
- Nhanh làm.
- Ít file thay đổi.

Nhược điểm:
- File detail sẽ dài và khó đọc hơn.
- Sau này muốn reuse section khác sẽ khó.

### Approach B: Tách component nhỏ, vẫn giữ phạm vi gọn

Tách trang thành các component nhỏ trong cùng thư mục hoặc `src/components/products/detail/`:

- `ProductHero`
- `UnitSelector`
- `QuantityStepper`
- `MedicineInfoTabs`
- `MedicineInfoSection`

Ưu điểm:
- Clean code, dễ đọc, dễ review.
- Mỗi phần UI có trách nhiệm rõ.
- Dễ bảo trì nếu sau này thêm tư vấn, tồn kho, nhà thuốc gần bạn.

Nhược điểm:
- Nhiều file hơn Approach A.

### Approach C: Làm lại cả flow product route theo slug

Đổi product card và detail route sang slug-first: `/products/:slug`.

Ưu điểm:
- Đúng chuẩn URL sản phẩm.
- Fetch detail ổn định hơn so với dùng title.

Nhược điểm:
- Chạm thêm `Product.js`, route, và cần fallback cho URL cũ đang dùng title.

## Khuyến nghị

Chọn Approach B, kèm một chỉnh nhỏ từ Approach C: vẫn giữ route hiện tại `/products/:title`, nhưng khi bấm View thì ưu tiên đẩy `slug` vào URL nếu có. Trang detail vẫn support cả slug và title để không làm gãy link cũ.

Lý do:

- UI detail sẽ sạch hơn, không dồn tất cả vào một file lớn.
- Tối ưu được data flow mà không sửa rộng toàn app.
- Phù hợp yêu cầu của bạn: đẹp hơn, giống tinh thần Long Châu, nhưng vẫn hợp website hiện tại.

## Data flow đề xuất

1. `Product.js`
   - Khi bấm View, dùng `slug` nếu có:

```js
history.push(`/products/${props.slug || title}`);
```

2. `ProductDetailScreen.js`
   - Đọc param hiện tại: `const { title: productKey } = useParams();`
   - Tìm sản phẩm trong `useFetch('products')` bằng `slug` hoặc `title` để render nhanh ảnh/giá cơ bản.
   - Nếu tìm được `slug`, gọi thêm:

```js
fetch(`${apiBase}/medicines/${slug}`)
```

   - Unwrap envelope `json.data || json`.
   - Merge dữ liệu list và detail để UI có đủ ảnh, giá, đơn vị tính, categories, medical info.

3. Nếu API detail lỗi:
   - Vẫn hiển thị dữ liệu cơ bản từ list.
   - Hiển thị thông báo nhẹ ở phần nội dung: "Chưa tải được thông tin chi tiết, vui lòng thử lại."

## Layout desktop

### 1. Product hero

Vùng đầu trang chia 2 cột:

- Cột trái: ảnh sản phẩm lớn, nền trắng, border nhẹ, bo góc vừa phải.
- Cột phải: thông tin mua hàng.

Nội dung cột phải:

- Badge "Chính hãng" hoặc "Sản phẩm nhà thuốc".
- Dòng phụ: quốc gia/nhóm sản phẩm nếu có dữ liệu.
- Tên thuốc lớn, rõ.
- Mã sản phẩm hoặc SKU fallback từ `id`.
- Rating + số review/comment fake fallback nếu API chưa có.
- Giá mặc định theo đơn vị đang chọn.
- Chọn đơn vị tính bằng chips từ `prices`.
- Chọn số lượng bằng stepper.
- CTA chính: `Chọn mua`.
- CTA phụ: `Tư vấn dược sĩ` hoặc `Tìm nhà thuốc`.

Tone thiết kế:

- Nền tổng thể trắng/xám rất nhạt.
- Màu chính xanh hiện tại của website.
- Không dùng card lồng card.
- Border radius vừa phải, khoảng 8px.
- Giá nổi bật nhưng không làm layout quá thương mại kiểu landing page.

### 2. Info body

Bên dưới hero là layout 2 cột:

- Sidebar trái: danh mục nội dung.
- Nội dung phải: bài viết thông tin thuốc.

Sidebar gồm:

- Công dụng
- Cách dùng
- Tác dụng phụ
- Lưu ý
- Bảo quản

Nội dung phải lấy từ:

- `medical_info.usage`
- `medical_info.dosage`
- `medical_info.adverse_effect`
- `medical_info.careful`
- `medical_info.preservation`

Nếu field nào không có, dùng fallback ngắn:

- "Thông tin đang được cập nhật."

### 3. Product meta

Một section nhỏ bên dưới hoặc trong sidebar phụ:

- Loại sản phẩm: `product_type`
- Danh mục: `categories`
- Đơn vị bán: `prices`
- Trạng thái: `is_active`

## Layout mobile

Trên mobile:

- Hero chuyển thành một cột.
- Ảnh sản phẩm nằm trên.
- CTA `Chọn mua` có thể sticky ở đáy màn hình nếu không che nội dung.
- Sidebar nội dung đổi thành tab ngang cuộn được.
- Giá và unit selector nằm ngay trước CTA.
- Text không dùng hero-scale quá lớn để tránh vỡ layout.

## Component đề xuất

### `ProductHero`

Trách nhiệm:

- Render ảnh, title, badge, rating, price, unit chips, quantity, CTA.

Props:

```js
{
  product,
  selectedUnit,
  onSelectUnit,
  quantity,
  onQuantityChange,
  onAddToCart,
  disabled
}
```

### `UnitSelector`

Trách nhiệm:

- Render danh sách `prices` thành chip chọn đơn vị.
- Nếu chỉ có một giá, vẫn hiển thị chip đó để người dùng hiểu đơn vị.

### `QuantityStepper`

Trách nhiệm:

- Tăng/giảm số lượng.
- Không cho nhỏ hơn 1.
- Input số ổn định, không làm layout nhảy.

### `MedicineInfoTabs`

Trách nhiệm:

- Render sidebar/tab.
- Scroll tới section tương ứng.
- Active state rõ ràng.

### `MedicineInfoSection`

Trách nhiệm:

- Render từng section nội dung thuốc với heading và body.
- Fallback khi thiếu dữ liệu.

## Mapping dữ liệu

```js
const defaultPrice = prices.find((item) => item.is_sell_default) || prices[0];

const displayProduct = {
  id: detail?.id || listItem?.id,
  title: detail?.name || listItem?.title,
  image: detail?.image_url || listItem?.image,
  description: detail?.description || listItem?.description,
  price: selectedUnit?.price || listItem?.price,
  productType: detail?.product_type || listItem?.category,
  prices: detail?.prices || [],
  categories: detail?.categories || [],
  medicalInfo: detail?.medical_info || {},
  slug: detail?.slug || listItem?.slug,
};
```

Lưu ý khi implement thật:

- `image_url` từ API có thể là `/uploads/...`, cần resolve sang backend host nếu FE chạy khác port.
- `price` có thể là number hoặc string, cần format bằng helper.
- `prices` dùng `measure_id`, `measure_name`, `is_sell_default`.

## Hiệu suất và clean code

- Không fetch detail nếu không tìm được slug.
- Dùng `useMemo` cho `displayProduct`, `prices`, `selectedPrice`.
- Dùng `useEffect` fetch detail chỉ khi `slug` đổi.
- Không filter `data` nhiều lần trong render; dùng `find` một lần bằng `useMemo`.
- Tách component nhỏ để `ProductDetailScreen.js` chỉ điều phối data và state.
- Không thêm thư viện UI mới.
- Không copy markup Long Châu; chỉ học bố cục thông tin.

## Trạng thái loading/error

Loading:

- Nếu list item đã có, render hero cơ bản trước.
- Phần thông tin chi tiết hiển thị skeleton hoặc text "Đang tải thông tin chi tiết..."

Error:

- Nếu detail API lỗi nhưng có list item, vẫn hiển thị sản phẩm cơ bản.
- Nếu không tìm thấy sản phẩm, hiển thị empty state có nút quay về `/products`.

## Những file dự kiến thay đổi khi được duyệt

- `src/screens/ProductDetailScreen.js`
- `src/components/products/Product.js`
- Có thể thêm:
  - `src/components/products/detail/ProductHero.js`
  - `src/components/products/detail/UnitSelector.js`
  - `src/components/products/detail/QuantityStepper.js`
  - `src/components/products/detail/MedicineInfoTabs.js`
  - `src/components/products/detail/MedicineInfoSection.js`

Không động vào các lỗi API còn lại trong `API_CONNECTION_AUDIT.md` trừ khi bạn yêu cầu riêng.

## Acceptance criteria

- Trang detail hiển thị đủ ảnh, tên thuốc, rating, giá, chọn đơn vị, chọn số lượng, CTA.
- Trang detail hiển thị các section thông tin thuốc: công dụng, cách dùng, tác dụng phụ, lưu ý, bảo quản.
- Giao diện desktop giống tinh thần ảnh tham khảo nhưng không copy y nguyên.
- Mobile không vỡ layout, text không chồng lên nhau.
- Nếu API detail lỗi, trang vẫn hiển thị dữ liệu cơ bản từ danh sách.
- Code dùng JavaScript/React hiện tại, không dùng TypeScript, không thêm thư viện mới.

