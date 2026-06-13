# Ke hoach chi tiet redesign trang chi tiet thuoc

Ngay viet: 2026-06-01

Pham vi: tai lieu mo ta tat ca thay doi du kien. Chua sua code FE that. Chi khi ban duyet thi moi bat dau implement.

Quyet dinh theo API documentation:

- Trang product list dung API list `GET /medicines?page=1&limit=...` de load thong tin co ban.
- Trang detail khong goi API list `GET /medicines`.
- Trang detail chi goi API co trong docs: `GET /medicines/:slug`.
- Giu nguyen FE route hien tai trong `src/App.js`, khong sua route.
- Slug truyen vao detail lay tu field `slug` trong response list API.
- Anh san pham van load bang `<img src={...} />`, khong them API anh, khong them helper build URL anh.
- Code de xuat dung ngon ngu dang dung o FE: React JavaScript, JSX, Tailwind class, hooks. Khong dung TypeScript.

## 1. API se dung

### 1.1. API list cho trang product list

Trang product list tiep tuc dung list API thong qua flow hien co:

```http
GET /medicines?page=1&limit=200 HTTP/1.1
Host: localhost:3001
```

Muc dich theo FE:

- Load danh sach thuoc.
- Hien card co ban: ten, anh, mo ta ngan, gia co ban.
- Lay `slug` de nut View dieu huong sang trang detail.

API list nay chi nen o man danh sach san pham, khong nen goi trong `ProductDetailScreen.js`.

### 1.2. API detail cho trang product detail

Trang detail chi dung API:

```http
GET /medicines/paracetamol-500mg HTTP/1.1
Host: localhost:3001
```

Response data theo API documentation:

```json
{
  "id": 1,
  "name": "Paracetamol 500mg",
  "slug": "paracetamol-500mg",
  "product_type": "DRUG",
  "description": "Thuoc giam dau ha sot",
  "image_url": "/uploads/paracetamol.png",
  "is_active": true,
  "created_at": "2026-05-10T10:00:00.000Z",
  "updated_at": "2026-05-10T10:00:00.000Z",
  "medical_info": {
    "usage": "Giam dau, ha sot",
    "dosage": "Dung theo huong dan bac si",
    "adverse_effect": "Co the gay di ung",
    "careful": "Khong dung qua lieu",
    "preservation": "Bao quan noi kho mat"
  },
  "prices": [
    {
      "price": 25000,
      "measure_id": 1,
      "measure_name": "Hop",
      "is_sell_default": true
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Thuoc giam dau",
      "slug": "thuoc-giam-dau",
      "is_primary": true
    }
  ]
}
```

### 1.3. API khong them trong lan redesign nay

- Khong them API load anh.
- Khong them API cart backend.
- Khong them API rating/review/comment.
- Khong them API tim nha thuoc.
- Khong sua checkout/order.

## 2. Mapping du lieu API sang UI

| UI tren trang detail | Lay tu field API | Ghi chu |
| --- | --- | --- |
| Ten thuoc | `name` | Hien trong H1 |
| Slug | `slug` | Dung cho route va tracking |
| Loai san pham | `product_type` | Badge, vi du `DRUG` |
| Mo ta ngan | `description` | Hien trong hero |
| Anh san pham | `image_url` | Dua truc tiep vao `img src` |
| Trang thai ban | `is_active` | `Dang ban` hoac `Tam ngung` |
| Gia | `prices[].price` | Doi theo don vi dang chon |
| Don vi tinh | `prices[].measure_name` | Chip chon don vi |
| Don vi mac dinh | `prices[].is_sell_default` | Auto select ban dau |
| Danh muc | `categories[].name` | Tags trong meta panel |
| Danh muc chinh | `categories[].is_primary` | Hien gan ma san pham |
| Cong dung | `medical_info.usage` | Tab/section ben duoi |
| Cach dung | `medical_info.dosage` | Tab/section ben duoi |
| Tac dung phu | `medical_info.adverse_effect` | Tab/section ben duoi |
| Luu y | `medical_info.careful` | Tab/section ben duoi |
| Bao quan | `medical_info.preservation` | Tab/section ben duoi |
| Ngay cap nhat | `updated_at` | Meta panel |

## 3. Nhung field khong tu tao

Response `GET /medicines/:slug` khong tra cac field sau, nen khong hien nhu du lieu that:

- Thuong hieu.
- Quoc gia san xuat.
- Rating.
- So danh gia.
- Binh luan.
- Ton kho.
- Nha thuoc gan ban.
- Ma SKU rieng.

Neu can ma hien thi cho de nhin, chi tao ma tu `id`:

```js
const displayCode = product.id ? `SP-${product.id}` : 'Dang cap nhat';
```

## 4. Danh sach file du kien se chinh sua

### 4.1. `src/components/products/Product.js`

Muc dich:

- Nut `View` dieu huong bang slug.
- Khong de detail page phai goi list API de resolve title sang slug.
- Day la dieu huong noi bo FE. Backend khong co API `/products/...`.
- Van giu FE route hien tai, chi thay gia tri truyen vao URL tu `title` sang `slug`.

Hien tai:

```jsx
<Button
  className="w-36 btn-primary py-3 px-2 poppins text-sm"
  text="View"
  onClick={() => history.push(`/products/${title}`)}
/>
```

De xuat:

```jsx
const handleViewDetail = () => {
  if (!props.slug) {
    swal('Thong bao', 'San pham chua co slug de xem chi tiet', 'info');
    return;
  }

  history.push(`/products/${props.slug}`);
};
```

```jsx
<Button
  className="w-36 btn-primary py-3 px-2 poppins text-sm"
  text="View"
  onClick={handleViewDetail}
/>
```

Ly do:

- API detail trong docs can `slug`.
- Product card da co `slug` tu API list.
- Neu slug thieu thi bao user thay vi dieu huong sang detail sai.
- Duong dan FE van la `/products/...`; thay doi o day chi de phan sau dau slash la slug dung cho API detail.

### 4.2. `src/screens/ProductDetailScreen.js`

Muc dich:

- Bo dependency vao `useFetch('products')`.
- Bo logic filter product trong list.
- Fetch truc tiep `GET /medicines/:slug` theo API documentation.
- Render UI moi theo response detail.

Se bo:

```js
import useFetch from '../hooks/useFetch';
```

Se bo logic:

```js
const { title } = useParams();
const [data] = useFetch('products');

data.filter(item => item.title === title).map(product => (
  ...
))
```

Ly do:

- `GET /medicines` chi nen nam o product list.
- Trang detail chi can slug tren URL.
- `filter().map()` cho detail la thua va co the render sai neu trung title.

### 4.3. `src/components/products/detail/ProductHero.js` - file moi

Muc dich:

- Chua phan UI dau trang: anh, ten, mo ta, gia, don vi, so luong, nut mua.
- Khong fetch API.
- Chi nhan props tu `ProductDetailScreen.js`.

### 4.4. `src/components/products/detail/MedicineInfoTabs.js` - file moi

Muc dich:

- Hien cac muc y khoa tu `medical_info`.
- Co tab/menu: Cong dung, Cach dung, Tac dung phu, Luu y, Bao quan.
- Khong fetch API.

### 4.5. `src/components/products/detail/ProductMetaPanel.js` - file moi

Muc dich:

- Hien thong tin phu: loai san pham, danh muc, trang thai, ngay cap nhat.
- Khong fetch API.

### 4.6. `src/utils/productsApi.js`

Muc dich:

- Chi them helper format tien neu trong file chua co.
- Khong sua cach load image.

Code de xuat:

```js
export const formatCurrency = (value) => {
  const numberValue = Number(value || 0);
  return `${numberValue.toLocaleString('vi-VN')}d`;
};
```

## 5. Data flow moi

Flow dung:

```text
Product list page
  -> GET /medicines?page=1&limit=200
  -> render Product cards
  -> user bam View, FE dua slug vao URL noi bo hien co
  -> history.push('/products/' + slug)
  -> ProductDetailScreen
  -> GET /medicines/:slug
  -> render detail
```

Flow khong dung nua:

```text
ProductDetailScreen
  -> GET /medicines
  -> find product by title
  -> render detail tu list
```

Ly do:

- Trang detail khong can load ca danh sach.
- Giam request thua va payload thua.
- Data detail dung nguon duy nhat la API detail.
- Code de doc hon: slug lay tu URL noi bo FE, backend fetch detail theo `GET /medicines/:slug`.

## 6. Chi tiet code `ProductDetailScreen.js`

### 6.1. Import du kien

```js
import React, { useEffect, useMemo, useState } from 'react';
import { BsArrowLeft } from 'react-icons/bs';
import { Link, useHistory, useParams } from 'react-router-dom';
import swal from 'sweetalert';
import MedicineInfoTabs from '../components/products/detail/MedicineInfoTabs';
import ProductHero from '../components/products/detail/ProductHero';
import ProductMetaPanel from '../components/products/detail/ProductMetaPanel';
import useAuth from '../hooks/useAuth';
import useOrder from '../hooks/useOrder';
import { formatCurrency, getApiBaseUrl } from '../utils/productsApi';
```

Bo cac import khong con dung:

```js
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { BsCart2 } from 'react-icons/bs';
import Rating from 'react-rating';
import Fade from 'react-reveal/Fade';
import useFetch from '../hooks/useFetch';
```

### 6.2. State du kien

```js
const { title: slug } = useParams();
const history = useHistory();
const { handleCart, orders } = useOrder();
const { user } = useAuth();

const [detail, setDetail] = useState(null);
const [detailLoading, setDetailLoading] = useState(false);
const [detailError, setDetailError] = useState('');
const [selectedUnitId, setSelectedUnitId] = useState(null);
const [quantity, setQuantity] = useState(1);
const [disabled, setDisabled] = useState(false);
```

Ghi chu:

- `src/App.js` hien dang dat FE route param la `:title`.
- Theo quyet dinh moi, giu nguyen FE route nay, khong sua `src/App.js`.
- Code detail chi alias `title` thanh `slug` vi gia tri duoc truyen vao URL se la slug.
- Day khong phai API `/products/:title`; day chi la ten param cua React Router hien co.

### 6.3. Fetch `GET /medicines/:slug`

```js
useEffect(() => {
  if (!slug) return;

  let cancelled = false;

  const loadDetail = async () => {
    setDetailLoading(true);
    setDetailError('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/medicines/${slug}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Khong tai duoc chi tiet thuoc');
      }

      if (!cancelled) {
        setDetail(json.data || json);
      }
    } catch (err) {
      if (!cancelled) {
        setDetailError(err.message || 'Khong tai duoc chi tiet thuoc');
        setDetail(null);
      }
    } finally {
      if (!cancelled) {
        setDetailLoading(false);
      }
    }
  };

  loadDetail();

  return () => {
    cancelled = true;
  };
}, [slug]);
```

Clean code/performance:

- Dependency chi la `slug`.
- Co `cancelled` de tranh set state sau unmount.
- Khong goi `GET /medicines` trong detail.
- Chap nhan ca response envelope `json.data` va raw `json`.

### 6.4. Tinh don vi gia

```js
const prices = useMemo(() => {
  return Array.isArray(detail?.prices) ? detail.prices : [];
}, [detail]);

const defaultUnit = useMemo(() => {
  return prices.find((item) => item.is_sell_default) || prices[0] || null;
}, [prices]);

useEffect(() => {
  if (!defaultUnit) return;

  setSelectedUnitId((current) => {
    return current || defaultUnit.measure_id;
  });
}, [defaultUnit]);

const selectedUnit = useMemo(() => {
  return prices.find((item) => item.measure_id === selectedUnitId) || defaultUnit;
}, [prices, selectedUnitId, defaultUnit]);
```

### 6.5. Normalize detail thanh data render

```js
const displayProduct = useMemo(() => {
  const primaryCategory =
    detail?.categories?.find((item) => item.is_primary) ||
    detail?.categories?.[0] ||
    null;

  return {
    id: detail?.id,
    name: detail?.name || 'San pham',
    slug: detail?.slug || slug,
    productType: detail?.product_type || '',
    description: detail?.description || '',
    image: detail?.image_url || '/assets/products/product1.jpg',
    isActive: Boolean(detail?.is_active),
    updatedAt: detail?.updated_at,
    price: selectedUnit?.price || 0,
    unitName: selectedUnit?.measure_name || '',
    prices,
    categories: detail?.categories || [],
    primaryCategory,
    medicalInfo: detail?.medical_info || {},
  };
}, [detail, prices, selectedUnit, slug]);
```

Luu y:

- Khong co `listItem`.
- Khong co fallback tu API list.
- Anh van dua truc tiep vao `img src`.
- Neu detail chua load xong thi khong render hero that, render loading.

### 6.6. Add to cart

```js
const canShop = Boolean(user?.id || user?.email);

const handleAddToCart = () => {
  if (!canShop) {
    swal('Login Required', 'Please sign in to add items to your cart', 'info');
    history.push('/signin');
    return;
  }

  handleCart(
    {
      id: displayProduct.id,
      title: displayProduct.name,
      image: displayProduct.image,
      price: displayProduct.price,
      slug: displayProduct.slug,
      unitName: displayProduct.unitName,
      measureId: selectedUnit?.measure_id,
    },
    quantity,
  );

  setDisabled(true);
  setQuantity(1);
  swal('Success', 'San pham da duoc them vao gio hang', 'success');
};
```

Ghi chu:

- Van dung cart local hien tai qua `useOrder().handleCart`.
- Chua noi API cart backend trong scope redesign nay.
- Co luu `unitName` va `measureId` de cart biet user da chon don vi nao.

### 6.7. Loading state

```jsx
if (detailLoading) {
  return (
    <main className="max-w-screen-xl py-24 mx-auto px-6">
      <div className="bg-white border border-gray-100 rounded-lg p-8">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-gray-100 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-12 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    </main>
  );
}
```

### 6.8. Error/empty state

```jsx
if (detailError || !detail) {
  return (
    <main className="max-w-screen-xl py-24 mx-auto px-6">
      <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Khong tim thay san pham</h1>
        <p className="mt-3 text-gray-500">
          {detailError || 'Thong tin thuoc dang khong kha dung.'}
        </p>
        <Link to="/products" className="inline-flex items-center gap-2 mt-4 text-blue-600">
          <BsArrowLeft />
          Quay lai danh sach thuoc
        </Link>
      </div>
    </main>
  );
}
```

### 6.9. Render main layout

```jsx
return (
  <main className="max-w-screen-xl py-24 mx-auto px-6">
    <Link to="/products" className="inline-flex items-center gap-2 mb-6 text-blue-600">
      <BsArrowLeft />
      Quay lai
    </Link>

    <ProductHero
      product={displayProduct}
      selectedUnit={selectedUnit}
      onSelectUnit={setSelectedUnitId}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAddToCart={handleAddToCart}
      disabled={disabled || orders.some((item) => item.id === displayProduct.id)}
      canShop={canShop}
      formatCurrency={formatCurrency}
    />

    <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <ProductMetaPanel product={displayProduct} />
      <MedicineInfoTabs medicalInfo={displayProduct.medicalInfo} />
    </div>
  </main>
);
```

## 7. Code du kien cho `ProductHero.js`

File moi:

```text
src/components/products/detail/ProductHero.js
```

```js
import React from 'react';
import { BsCart2 } from 'react-icons/bs';

const ProductHero = ({
  product,
  selectedUnit,
  onSelectUnit,
  quantity,
  onQuantityChange,
  onAddToCart,
  disabled,
  canShop,
  formatCurrency,
}) => {
  const handleQuantityInput = (event) => {
    const nextValue = Number(event.target.value);
    onQuantityChange(Math.max(1, nextValue || 1));
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-gray-100 rounded-lg p-5 md:p-6">
      <div className="flex items-center justify-center bg-gray-50 rounded-lg p-5 min-h-[300px] md:min-h-[420px]">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-[420px] w-full object-contain"
        />
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {product.productType && (
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-50 text-blue-700">
              {product.productType}
            </span>
          )}

          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              product.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {product.isActive ? 'Dang ban' : 'Tam ngung'}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          {product.name}
        </h1>

        <div className="mt-3 text-sm text-gray-500">
          Ma san pham: {product.id ? `SP-${product.id}` : 'Dang cap nhat'}
          {product.primaryCategory && (
            <span> | Danh muc: {product.primaryCategory.name}</span>
          )}
        </div>

        {product.description && (
          <p className="mt-4 text-gray-600 leading-7">
            {product.description}
          </p>
        )}

        <div className="mt-5 text-3xl md:text-4xl font-bold text-blue-700">
          {formatCurrency(product.price)}
          {product.unitName && (
            <span className="text-lg md:text-xl font-medium text-blue-600">
              {' '} / {product.unitName}
            </span>
          )}
        </div>

        {product.prices.length > 0 && (
          <div className="mt-6">
            <div className="text-gray-700 font-semibold mb-2">Chon don vi tinh</div>
            <div className="flex flex-wrap gap-2">
              {product.prices.map((item) => {
                const active = selectedUnit?.measure_id === item.measure_id;

                return (
                  <button
                    key={item.measure_id}
                    type="button"
                    onClick={() => onSelectUnit(item.measure_id)}
                    className={`px-4 py-2 rounded-full border font-semibold transition ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {item.measure_name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="text-gray-700 font-semibold mb-2">Chon so luong</div>
          <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-gray-50 hover:bg-gray-100 font-bold"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityInput}
              className="w-14 h-10 text-center border-l border-r outline-none"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-10 h-10 bg-gray-50 hover:bg-gray-100 font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {canShop && (
            <button
              type="button"
              disabled={disabled || !product.isActive}
              onClick={onAddToCart}
              className="btn-primary py-3 px-5 flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BsCart2 />
              Chon mua
            </button>
          )}

          <button
            type="button"
            className="py-3 px-5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
          >
            Tu van duoc si
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
```

## 8. Code du kien cho `MedicineInfoTabs.js`

File moi:

```text
src/components/products/detail/MedicineInfoTabs.js
```

```js
import React, { useMemo, useState } from 'react';

const sections = [
  { id: 'usage', label: 'Cong dung' },
  { id: 'dosage', label: 'Cach dung' },
  { id: 'adverse_effect', label: 'Tac dung phu' },
  { id: 'careful', label: 'Luu y' },
  { id: 'preservation', label: 'Bao quan' },
];

const MedicineInfoTabs = ({ medicalInfo }) => {
  const [activeId, setActiveId] = useState(sections[0].id);

  const activeSection = useMemo(() => {
    return sections.find((section) => section.id === activeId) || sections[0];
  }, [activeId]);

  const content = medicalInfo?.[activeSection.id] || 'Thong tin dang duoc cap nhat.';

  return (
    <section className="lg:col-span-3 bg-white border border-gray-100 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4">
        <aside className="md:border-r border-gray-100">
          {sections.map((section) => {
            const active = activeId === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`w-full text-left px-5 py-4 border-b last:border-b-0 font-semibold ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </aside>

        <article className="md:col-span-3 p-5 md:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {activeSection.label}
          </h2>
          <p className="text-gray-700 leading-7 whitespace-pre-line">
            {content}
          </p>
        </article>
      </div>
    </section>
  );
};

export default MedicineInfoTabs;
```

## 9. Code du kien cho `ProductMetaPanel.js`

File moi:

```text
src/components/products/detail/ProductMetaPanel.js
```

```js
import React from 'react';

const formatDate = (value) => {
  if (!value) return 'Dang cap nhat';

  return new Date(value).toLocaleDateString('vi-VN');
};

const ProductMetaPanel = ({ product }) => {
  return (
    <aside className="lg:col-span-1 bg-white border border-gray-100 rounded-lg p-5 h-fit">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Thong tin san pham</h2>

      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-gray-500">Loai san pham</dt>
          <dd className="font-semibold text-gray-900">{product.productType || 'Dang cap nhat'}</dd>
        </div>

        <div>
          <dt className="text-gray-500">Trang thai</dt>
          <dd className={product.isActive ? 'font-semibold text-green-700' : 'font-semibold text-gray-500'}>
            {product.isActive ? 'Dang ban' : 'Tam ngung'}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Danh muc</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {product.categories.length > 0 ? (
              product.categories.map((category) => (
                <span
                  key={category.id || category.slug}
                  className="px-2 py-1 rounded bg-gray-100 text-gray-700"
                >
                  {category.name}
                </span>
              ))
            ) : (
              <span className="font-semibold text-gray-900">Dang cap nhat</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Cap nhat lan cuoi</dt>
          <dd className="font-semibold text-gray-900">{formatDate(product.updatedAt)}</dd>
        </div>
      </dl>
    </aside>
  );
};

export default ProductMetaPanel;
```

## 10. Ket qua UI du kien

### 10.1. Desktop

Phan dau trang:

- Ben trai: anh thuoc lon, nen xam nhe, `object-contain`.
- Ben phai:
  - Badge `product_type`.
  - Badge `Dang ban` hoac `Tam ngung`.
  - Ten thuoc.
  - Ma `SP-{id}` va danh muc chinh.
  - Mo ta ngan.
  - Gia lon theo don vi dang chon.
  - Chip don vi tinh tu `prices`.
  - Stepper so luong.
  - Nut `Chon mua`.
  - Nut phu `Tu van duoc si`.

Phan duoi:

- Cot trai: thong tin san pham, danh muc, ngay cap nhat.
- Cot phai: tab noi dung y khoa.

### 10.2. Mobile

- Layout 1 cot.
- Anh len dau, sau do thong tin/gia/nut mua.
- Chip don vi wrap xuong dong neu nhieu don vi.
- Meta panel va medicine tabs xep doc.
- Button khong bi tran chu.

### 10.3. Loading

- Vi detail page khong goi list API, luc load se hien skeleton.
- Khong hien tam data list trong detail nua.
- Khi API detail ve, render hero va info tu response.

### 10.4. Error

Neu `GET /medicines/:slug` loi:

- Hien `Khong tim thay san pham`.
- Hien message loi neu backend tra ve.
- Co link quay lai `/products`.

## 11. Toi uu performance va clean code

Se lam:

- Detail page khong goi `GET /medicines`, giam request thua.
- Fetch detail chi theo `slug`.
- Dung `useMemo` cho `prices`, `defaultUnit`, `selectedUnit`, `displayProduct`.
- Tach UI thanh 3 component co nhiem vu ro:
  - `ProductHero`: hero/action.
  - `ProductMetaPanel`: thong tin phu.
  - `MedicineInfoTabs`: noi dung y khoa.
- Component con khong fetch API.
- Khong lap description nhieu lan.
- Khong render rating/review fake.
- Khong them thu vien moi.
- Khong them global state moi.

Khong lam trong scope nay:

- Khong rewrite toan bo product list.
- Khong doi cart architecture.
- Khong noi cart backend.
- Khong sua checkout/order.
- Khong sua cac loi API con lai trong audit.

## 12. Rui ro va cach xu ly

### 12.1. Product card thieu slug

Rui ro:

- Detail page can slug de goi API trong docs: `GET /medicines/:slug`.
- Neu card chi co title thi detail se goi sai API.

Xu ly:

- Nut View phai dung `props.slug`.
- Neu thieu slug thi disable nut View hoac khong navigate.
- Co the hien tooltip/text ngan neu can, nhung ban code de xuat se giu gon.

### 12.2. URL noi bo FE cu dang chua dung slug

Rui ro:

- Neu URL noi bo FE cu truyen title thay vi slug thi se khong dam bao load detail.

Xu ly de xuat:

- Chap nhan vi flow moi tu product card se truyen slug lay tu API list.
- Neu muon backward compatible tuyet doi, can them API search/resolve title sang slug, nhung dieu do lai lam detail page phai goi them API khac. Minh khong khuyen nghi trong scope nay.

### 12.3. API detail tra envelope khac

Rui ro:

- API co the tra `{ data: medicine }` hoac medicine raw.

Xu ly:

```js
setDetail(json.data || json);
```

### 12.4. `prices` rong

Rui ro:

- Khong co gia de render.

Xu ly:

- Hien `0d` theo helper hien tai.
- Neu ban muon dep hon khi implement, co the doi thanh text `Lien he` khi `prices.length === 0`.

### 12.5. `medical_info` null

Rui ro:

- Tab y khoa bi loi khi access property.

Xu ly:

```js
medicalInfo: detail?.medical_info || {}
```

Va trong tab:

```js
const content = medicalInfo?.[activeSection.id] || 'Thong tin dang duoc cap nhat.';
```

### 12.6. Anh tu API la relative path

Theo yeu cau cua ban:

- Khong them API anh.
- Khong them helper build URL.
- Van dua gia tri vao `img src`.

Code:

```jsx
<img src={product.image} alt={product.name} />
```

## 13. Checklist implement neu ban duyet

1. Sua `src/components/products/Product.js`.

```text
View button -> history.push('/products/' + props.slug)
```

Ghi chu:

- Giu nguyen FE route `/products/...`.
- Khong sua `src/App.js`.
- Chi thay `title` bang `slug` khi dieu huong tu card sang detail.

2. Sua `src/screens/ProductDetailScreen.js`.

Noi dung:

- Bo `useFetch('products')`.
- Bo filter product tu list.
- Doc slug tu param FE hien co bang `const { title: slug } = useParams();`.
- Fetch `GET /medicines/:slug`.
- Normalize detail data.
- Render loading/error.
- Render `ProductHero`, `ProductMetaPanel`, `MedicineInfoTabs`.

3. Tao folder/file:

```text
src/components/products/detail/ProductHero.js
src/components/products/detail/MedicineInfoTabs.js
src/components/products/detail/ProductMetaPanel.js
```

4. Sua `src/utils/productsApi.js` neu can.

Noi dung:

- Them `formatCurrency`.
- Khong sua image logic.

## 14. Checklist verify sau khi implement

Kiem tra detail page khong con goi API list:

```powershell
rg -n "useFetch\\('products'\\)|GET /medicines|medicines\\?page|medicines\\?limit" src/screens/ProductDetailScreen.js
```

Kiem tra detail page co goi API slug:

```powershell
rg -n "/medicines/\\$\\{slug\\}|useParams\\(\\)" src/screens/ProductDetailScreen.js
```

Kiem tra nut View dung slug lay tu response list:

```powershell
rg -n "props.slug|handleViewDetail" src/components/products/Product.js
```

Kiem tra khong con rating/review fake trong detail:

```powershell
rg -n "Rating|reviews|rating|AiFillStar|AiOutlineStar" src/screens/ProductDetailScreen.js
```

Kiem tra build:

```powershell
npm.cmd run build
```

## 15. Tom tat de ban duyet nhanh

Neu ban dong y, lan implement se chi lam:

- Product list van dung `GET /medicines`.
- Detail page khong dung `GET /medicines`.
- Detail page chi dung `GET /medicines/:slug`.
- Giu nguyen FE route `/products/...`.
- Product card View truyen slug lay tu response list API vao URL noi bo FE.
- Khong de xuat them hay doi backend API nao ngoai API documentation.
- Redesign detail page theo response detail.
- Them 3 component UI gon, khong fetch API trong component con.
- Khong them API anh.
- Khong noi cart backend.
- Khong them du lieu gia nhu rating, review, thuong hieu, quoc gia.
