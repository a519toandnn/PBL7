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
  needsPriceConsultation,
  consultationText,
  formatCurrency,
}) => {
  const handleQuantityInput = (event) => {
    const nextValue = Number(event.target.value);
    onQuantityChange(Math.max(1, nextValue || 1));
  };

  const purchaseDisabled = disabled || !product.isActive;
  const shouldConsultPrice = needsPriceConsultation(product.price);
  const hasSellableUnit = product.prices.some((item) => !needsPriceConsultation(item.price));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-gray-100 rounded-lg p-5 md:p-6">
      <div className="flex items-center justify-center bg-gray-50 rounded-lg p-5 h-80 md:h-96 lg:h-full">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full w-full object-contain"
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
            {product.isActive ? 'Đang bán' : 'Tạm ngưng'}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          {product.name}
        </h1>

        <div className="mt-3 text-sm text-gray-500">
          Mã sản phẩm: {product.id ? `SP-${product.id}` : 'Đang cập nhật'}
          {product.primaryCategory && (
            <span> | Danh mục: {product.primaryCategory.name}</span>
          )}
        </div>

        {product.description && (
          <p className="mt-4 text-gray-700 leading-7 bg-gray-50 border border-gray-100 rounded-lg p-4">
            {product.description}
          </p>
        )}

        <div className="mt-5">
          {shouldConsultPrice ? (
            <div className="inline-flex rounded-lg bg-blue-50 px-4 py-3 text-xl font-bold text-blue-700">
              {consultationText}
            </div>
          ) : (
            <div className="text-3xl md:text-4xl font-bold text-blue-700">
              {formatCurrency(product.price)}
              {product.unitName && (
                <span className="text-lg md:text-xl font-medium text-blue-600">
                  {' '} / {product.unitName}
                </span>
              )}
            </div>
          )}
        </div>

        {product.prices.length > 0 && hasSellableUnit && (
          <div className="mt-6">
            <div className="text-gray-700 font-semibold mb-2">Chọn đơn vị tính</div>
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

        {!shouldConsultPrice && (
          <div className="mt-6">
            <div className="text-gray-700 font-semibold mb-2">Chọn số lượng</div>
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
        )}

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {canShop && !shouldConsultPrice && (
            <button
              type="button"
              disabled={purchaseDisabled}
              onClick={onAddToCart}
              className={`btn-primary py-3 px-5 flex items-center justify-center gap-2 text-base font-semibold ${
                purchaseDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <BsCart2 />
              Chọn mua
            </button>
          )}

          <button
            type="button"
            className="py-3 px-5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
          >
            Tư vấn dược sĩ
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
