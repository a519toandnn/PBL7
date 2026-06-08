import React from 'react';
import { BsPlus, BsTrash } from 'react-icons/bs';

const inputClass = 'w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelClass = 'mb-2 block text-sm font-semibold text-gray-700';
const priceGridStyle = {
  gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(150px, 1fr) 120px 48px',
};

const Section = ({ title, description, children }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-5">
    <div className="mb-5">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {children}
  </section>
);

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const AdminProductForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  editing,
  measureUnitOptions = [],
  onPriceChange,
  onAddPrice,
  onRemovePrice,
  onSetDefaultPrice,
}) => {
  const priceRows = Array.isArray(formData.prices) ? formData.prices : [];

  const getCurrentUnitMissingFromOptions = (row) => {
    if (!row.measure_unit_id) return null;
    const exists = measureUnitOptions.some((unit) => String(unit.id) === String(row.measure_unit_id));
    if (exists) return null;

    return {
      id: row.measure_unit_id,
      name: row.measure_name || `Đơn vị #${row.measure_unit_id}`,
    };
  };

  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <h2 className="text-2xl font-bold text-gray-900">
          {editing ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Cập nhật thông tin thuốc, hình ảnh, đơn vị bán và giá theo từng đơn vị tính.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 p-6">
        <Section title="Thông tin cơ bản" description="Các thông tin định danh chính của thuốc.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Tên thuốc *">
              <input
                type="text"
                name="title"
                placeholder="Nhập tên thuốc"
                value={formData.title}
                onChange={onChange}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Slug">
              <input
                type="text"
                name="slug"
                placeholder="Tự tạo nếu để trống"
                value={formData.slug}
                onChange={onChange}
                className={inputClass}
              />
            </Field>

            <Field label="Loại sản phẩm">
              <select
                name="product_type"
                value={formData.product_type}
                onChange={onChange}
                className={inputClass}
              >
                <option value="DRUG">Thuốc</option>
                <option value="SUPPLEMENT">Thực phẩm chức năng</option>
                <option value="OTHER">Khác</option>
              </select>
            </Field>

            <Field label="Nhà sản xuất">
              <input
                type="text"
                name="manufacturer"
                placeholder="Nhập nhà sản xuất"
                value={formData.manufacturer}
                onChange={onChange}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="Danh mục và hình ảnh" description="Category IDs là dữ liệu gửi về backend, tên danh mục chỉ để hỗ trợ đọc nhanh.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Tên danh mục hiển thị">
              <input
                type="text"
                name="category"
                placeholder="Ví dụ: Thuốc"
                value={formData.category}
                onChange={onChange}
                className={inputClass}
              />
            </Field>

            <Field label="Category IDs">
              <input
                type="text"
                name="category_ids"
                placeholder="Ví dụ: 1, 3"
                value={formData.category_ids}
                onChange={onChange}
                className={inputClass}
              />
            </Field>

            <Field label="Image URL" className="md:col-span-2">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <input
                  type="text"
                  name="image_url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={onChange}
                  className={inputClass}
                />
                <div className="flex h-28 items-center justify-center rounded-md border border-gray-200 bg-white">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Preview thuốc"
                      className="h-full w-full rounded-md object-contain p-2"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Preview ảnh</span>
                  )}
                </div>
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Mô tả và thông tin sử dụng" description="Mô tả không bắt buộc, có thể để trống nếu chưa có dữ liệu.">
          <div className="grid grid-cols-1 gap-5">
            <Field label="Mô tả sản phẩm">
              <textarea
                name="description"
                placeholder="Nhập mô tả sản phẩm"
                value={formData.description}
                onChange={onChange}
                rows="4"
                className={inputClass}
              />
            </Field>

            <Field label="Thông tin sử dụng">
              <textarea
                name="usage"
                placeholder="Nhập công dụng, chỉ định hoặc thông tin sử dụng"
                value={formData.usage}
                onChange={onChange}
                rows="3"
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="Giá theo đơn vị tính">
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <div className="space-y-3" style={{ minWidth: 720 }}>
                <div
                  className="grid gap-3 px-1 text-sm font-semibold text-gray-500"
                  style={priceGridStyle}
                >
                  <span>Đơn vị tính</span>
                  <span>Giá bán</span>
                  <span>Mặc định</span>
                  <span />
                </div>

                {priceRows.map((row, index) => {
                  const missingOption = getCurrentUnitMissingFromOptions(row);

                  return (
                    <div
                      key={`${row.measure_unit_id || 'new'}-${index}`}
                      className="grid items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      style={priceGridStyle}
                    >
                      <select
                        value={row.measure_unit_id}
                        onChange={(event) => onPriceChange(index, 'measure_unit_id', event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Chọn đơn vị tính</option>
                        {missingOption && (
                          <option value={missingOption.id}>{missingOption.name}</option>
                        )}
                        {measureUnitOptions.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0"
                        name={`price-${index}`}
                        placeholder="Nhập giá"
                        value={row.price}
                        onChange={(event) => onPriceChange(index, 'price', event.target.value)}
                        className={inputClass}
                      />

                      <label className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700">
                        <input
                          type="radio"
                          name="default-price"
                          checked={Boolean(row.is_sell_default)}
                          onChange={() => onSetDefaultPrice(index)}
                          className="h-4 w-4 text-blue-600"
                        />
                        Mặc định
                      </label>

                      <button
                        type="button"
                        onClick={() => onRemovePrice(index)}
                        className="inline-flex h-12 items-center justify-center rounded-md border border-red-100 bg-white text-red-600 transition hover:bg-red-50"
                        aria-label="Xóa dòng giá"
                      >
                        <BsTrash />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={onAddPrice}
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <BsPlus className="text-lg" />
              Thêm giá
            </button>
          </div>
        </Section>

        <Section title="Đánh giá" description="Thông tin phụ trợ hiển thị trên danh sách sản phẩm.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Rating (1-5)">
              <input
                type="number"
                name="rating"
                min="1"
                max="5"
                value={formData.rating}
                onChange={onChange}
                className={inputClass}
              />
            </Field>

            <Field label="Số lượt đánh giá">
              <input
                type="number"
                name="reviews"
                min="0"
                value={formData.reviews}
                onChange={onChange}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white pt-5 sm:flex-row">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center rounded-md bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            {editing ? 'Cập nhật thuốc' : 'Thêm thuốc'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
