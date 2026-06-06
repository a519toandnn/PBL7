import React from 'react';

const formatDate = (value) => {
  if (!value) return 'Đang cập nhật';

  return new Date(value).toLocaleDateString('vi-VN');
};

const ProductMetaPanel = ({ product }) => {
  return (
    <aside className="lg:col-span-1 bg-white border border-gray-100 rounded-lg p-5 h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin sản phẩm</h2>

      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-gray-500">Loại sản phẩm</dt>
          <dd className="font-semibold text-gray-900">
            {product.productType || 'Đang cập nhật'}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Trạng thái</dt>
          <dd className={product.isActive ? 'font-semibold text-green-700' : 'font-semibold text-gray-500'}>
            {product.isActive ? 'Đang bán' : 'Tạm ngưng'}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Danh mục</dt>
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
              <span className="font-semibold text-gray-900">Đang cập nhật</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Cập nhật lần cuối</dt>
          <dd className="font-semibold text-gray-900">
            {formatDate(product.updatedAt)}
          </dd>
        </div>
      </dl>
    </aside>
  );
};

export default ProductMetaPanel;
