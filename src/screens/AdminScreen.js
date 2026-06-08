import React, { useState, useEffect } from 'react';
import { BsPlus } from 'react-icons/bs';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';
import AdminProductTable from '../components/Admin/AdminProductTable';
import AdminProductForm from '../components/Admin/AdminProductForm';
import { fetchMedicinePage, searchMedicinePage } from '../utils/productsApi';
import { apiFetch, getAuthHeaders, getListData } from '../utils/apiClient';

const DEFAULT_MEASURE_UNIT_ID = 1;
const ADMIN_PRODUCTS_PER_PAGE = 100;
const defaultProductPagination = {
  total: 0,
  page: 1,
  limit: ADMIN_PRODUCTS_PER_PAGE,
  totalPages: 1,
};

export const createPriceRow = (overrides = {}) => ({
  measure_unit_id: overrides.measure_unit_id ?? overrides.measure_id ?? DEFAULT_MEASURE_UNIT_ID,
  measure_name: overrides.measure_name || overrides.measure_unit_name || '',
  price: overrides.price !== undefined && overrides.price !== null ? String(overrides.price) : '',
  is_sell_default: overrides.is_sell_default !== undefined ? Boolean(overrides.is_sell_default) : true,
});

export const ensureOneDefaultPrice = (rows = []) => {
  if (!rows.length) return [createPriceRow()];

  let defaultApplied = false;
  const normalizedRows = rows.map((row) => {
    const shouldDefault = row.is_sell_default && !defaultApplied;
    if (shouldDefault) defaultApplied = true;
    return { ...row, is_sell_default: shouldDefault };
  });

  if (!defaultApplied) {
    return normalizedRows.map((row, index) => ({
      ...row,
      is_sell_default: index === 0,
    }));
  }

  return normalizedRows;
};

export const normalizePriceRows = (prices = [], fallback = {}) => {
  const sourceRows = Array.isArray(prices) && prices.length > 0
    ? prices
    : (fallback.price || fallback.measure_unit_id || fallback.measure_id ? [fallback] : []);

  const rows = sourceRows.length > 0
    ? sourceRows.map((row, index) => createPriceRow({
        measure_unit_id: row.measure_unit_id ?? row.measure_id ?? DEFAULT_MEASURE_UNIT_ID,
        measure_name: row.measure_name || row.measure_unit_name || '',
        price: row.price ?? '',
        is_sell_default: row.is_sell_default !== undefined ? row.is_sell_default : index === 0,
      }))
    : [createPriceRow()];

  return ensureOneDefaultPrice(rows);
};

export const mergeMeasureUnitOptions = (currentOptions = [], priceRows = []) => {
  const optionMap = new Map();

  currentOptions.forEach((unit) => {
    const id = Number(unit.id);
    if (Number.isFinite(id) && unit.name) {
      optionMap.set(String(id), { id, name: unit.name });
    }
  });

  priceRows.forEach((row) => {
    const id = Number(row.measure_unit_id ?? row.measure_id);
    const name = row.measure_name || row.measure_unit_name;
    if (Number.isFinite(id) && name && !optionMap.has(String(id))) {
      optionMap.set(String(id), { id, name });
    }
  });

  return Array.from(optionMap.values());
};

export const createEmptyFormData = () => ({
  title: '',
  slug: '',
  product_type: 'DRUG',
  category: '',
  category_ids: '',
  description: '',
  image_url: '',
  prices: [createPriceRow()],
  manufacturer: '',
  usage: '',
  rating: 4,
  reviews: 0
});

const slugify = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const parseNumberList = (value) => {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  return String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
};

const parsePrice = (value) => {
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  const price = Number(normalized);
  return Number.isFinite(price) ? price : 0;
};

export const validatePriceRows = (prices = []) => {
  const rows = Array.isArray(prices) ? prices : [];
  const errors = [];
  const seenMeasureIds = new Set();
  let hasDefault = false;

  rows.forEach((row) => {
    const measureUnitId = Number(row.measure_unit_id);
    const price = parsePrice(row.price);
    const rowHasInput = Boolean(row.measure_unit_id || row.price);

    if (!rowHasInput) return;

    if (!Number.isFinite(measureUnitId) || measureUnitId <= 0) {
      errors.push('Vui lòng chọn đơn vị tính hợp lệ cho từng dòng giá.');
      return;
    }

    if (seenMeasureIds.has(measureUnitId)) {
      errors.push('Mỗi đơn vị tính chỉ được xuất hiện một lần.');
      return;
    }

    seenMeasureIds.add(measureUnitId);

    if (!Number.isFinite(price) || price < 0) {
      errors.push('Giá bán phải là số lớn hơn hoặc bằng 0.');
    }

    if (row.is_sell_default) {
      hasDefault = true;
    }
  });

  if (rows.some((row) => row.measure_unit_id || row.price) && !hasDefault) {
    errors.push('Vui lòng chọn một giá mặc định.');
  }

  return Array.from(new Set(errors));
};

const detailToFormData = (detail, fallback = {}) => {
  return {
    ...createEmptyFormData(),
    title: detail.name || fallback.title || '',
    slug: detail.slug || fallback.slug || '',
    product_type: detail.product_type || fallback.product_type || 'DRUG',
    category: detail.categories?.[0]?.name || fallback.category || '',
    category_ids: Array.isArray(detail.categories)
      ? detail.categories.map((category) => category.id).join(', ')
      : '',
    description: detail.description || fallback.description || '',
    image_url: detail.image_url || '',
    prices: normalizePriceRows(detail.prices, fallback),
    manufacturer: fallback.manufacturer || '',
    usage: detail.medical_info?.usage || fallback.usage || '',
    rating: fallback.rating || 4,
    reviews: fallback.reviews || 0,
  };
};

export const toMedicinePayload = (formData) => {
  return {
    name: formData.title.trim(),
    slug: (formData.slug || slugify(formData.title)).trim(),
    product_type: formData.product_type || 'DRUG',
    description: formData.description || null,
    image_url: formData.image_url || null,
    is_active: true,
    category_ids: parseNumberList(formData.category_ids),
    prices: normalizePriceRows(formData.prices)
      .filter((row) => Number(row.measure_unit_id) > 0 && parsePrice(row.price) > 0)
      .map((row) => ({
        measure_unit_id: Number(row.measure_unit_id),
        price: parsePrice(row.price),
        is_sell_default: Boolean(row.is_sell_default),
      })),
    medical_info: {
      usage: formData.usage || '',
    },
  };
};

const AdminScreen = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(createEmptyFormData());
  const [measureUnitOptions, setMeasureUnitOptions] = useState([]);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState(defaultProductPagination);
  const [productsLoading, setProductsLoading] = useState(false);

  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || false;

  useEffect(() => {
    if (!isAdmin) return;
    fetchMeasureUnits();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProducts(currentProductPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, currentProductPage, searchTerm]);

  const fetchProducts = async (page = currentProductPage, query = searchTerm) => {
    setProductsLoading(true);
    try {
      const normalizedQuery = query.trim();
      const result = normalizedQuery
        ? await searchMedicinePage({ q: normalizedQuery, page, limit: ADMIN_PRODUCTS_PER_PAGE })
        : await fetchMedicinePage({ page, limit: ADMIN_PRODUCTS_PER_PAGE });

      setProducts(
        result.products.sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      );
      setProductPagination(result.pagination || defaultProductPagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setProductPagination(defaultProductPagination);
      swal('Error', 'Failed to load products', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rating' || name === 'reviews' ? Number(value) : value
    });
  };

  const handlePriceChange = (index, field, value) => {
    setFormData((current) => {
      const prices = normalizePriceRows(current.prices);
      const nextPrices = prices.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        if (field === 'measure_unit_id') {
          const selectedUnit = measureUnitOptions.find((unit) => String(unit.id) === String(value));
          return {
            ...row,
            measure_unit_id: value,
            measure_name: selectedUnit?.name || '',
          };
        }

        return {
          ...row,
          [field]: value,
        };
      });

      return {
        ...current,
        prices: ensureOneDefaultPrice(nextPrices),
      };
    });
  };

  const handleAddPrice = () => {
    setFormData((current) => {
      const currentPrices = normalizePriceRows(current.prices);
      const usedMeasureIds = new Set(currentPrices.map((row) => String(row.measure_unit_id)));
      const nextUnit = measureUnitOptions.find((unit) => !usedMeasureIds.has(String(unit.id))) || measureUnitOptions[0];

      return {
        ...current,
        prices: [
          ...currentPrices,
          createPriceRow({
            measure_unit_id: nextUnit?.id || DEFAULT_MEASURE_UNIT_ID,
            measure_name: nextUnit?.name || '',
            is_sell_default: false,
          }),
        ],
      };
    });
  };

  const handleRemovePrice = (index) => {
    setFormData((current) => ({
      ...current,
      prices: ensureOneDefaultPrice(
        normalizePriceRows(current.prices).filter((_, rowIndex) => rowIndex !== index)
      ),
    }));
  };

  const handleSetDefaultPrice = (index) => {
    setFormData((current) => ({
      ...current,
      prices: normalizePriceRows(current.prices).map((row, rowIndex) => ({
        ...row,
        is_sell_default: rowIndex === index,
      })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      swal('Validation Error', 'Vui lòng nhập tên thuốc', 'warning');
      return;
    }

    const priceErrors = validatePriceRows(formData.prices);
    if (priceErrors.length > 0) {
      swal('Giá bán chưa hợp lệ', priceErrors.join('\n'), 'warning');
      return;
    }

    try {
      const payload = toMedicinePayload(formData);
      await apiFetch(editingId ? `/medicines/${editingId}` : '/medicines', {
        method: editingId ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      await fetchProducts();
      swal('Success', editingId ? 'Product updated successfully' : 'Product added successfully', 'success');
      setEditingId(null);
      setFormData(createEmptyFormData());
      setShowForm(false);
    } catch (error) {
      swal('Error', error.message || 'Save product failed', 'error');
    }
  };

  const fetchMeasureUnits = async () => {
    try {
      const payload = await apiFetch('/measure-units', {
        headers: getAuthHeaders(null),
      });
      const units = getListData(payload)
        .map((unit) => ({
          id: Number(unit.id),
          name: unit.name,
        }))
        .filter((unit) => Number.isFinite(unit.id) && unit.name);

      setMeasureUnitOptions(units);
    } catch (error) {
      setMeasureUnitOptions([]);
      console.warn('Không tải được danh sách đơn vị tính:', error);
    }
  };

  const handleEdit = async (product) => {
    setFormData({ ...createEmptyFormData(), ...product, prices: normalizePriceRows([], product) });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!product.slug) return;

    try {
      const detail = await apiFetch(`/medicines/${product.slug}`);
      const nextFormData = detailToFormData(detail, product);
      setMeasureUnitOptions((currentOptions) => mergeMeasureUnitOptions(currentOptions, nextFormData.prices));
      setFormData(nextFormData);
    } catch (error) {
      swal('Warning', error.message || 'Failed to load product details', 'warning');
    }
  };

  const handleDelete = (id) => {
    swal({
      title: 'Are you sure?',
      text: 'This product will be deleted permanently',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        apiFetch(`/medicines/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(null),
        })
          .then(() => {
            fetchProducts(safeProductPage, searchTerm);
            swal('Success', 'Product deleted successfully', 'success');
          })
          .catch((error) => {
            swal('Error', error.message || 'Delete product failed', 'error');
          });
      }
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(createEmptyFormData());
  };

  const totalProductPages = Math.max(1, Number(productPagination.totalPages || 1));
  const totalProducts = Number(productPagination.total || products.length || 0);
  const safeProductPage = Math.min(currentProductPage, totalProductPages);
  const pageStartIndex = totalProducts === 0 ? 0 : ((safeProductPage - 1) * ADMIN_PRODUCTS_PER_PAGE) + 1;
  const pageEndIndex = Math.min((safeProductPage - 1) * ADMIN_PRODUCTS_PER_PAGE + products.length, totalProducts);

  useEffect(() => {
    if (currentProductPage > totalProductPages) {
      setCurrentProductPage(totalProductPages);
    }
  }, [currentProductPage, totalProductPages]);

  const handleProductPageChange = (nextPage) => {
    const safeNextPage = Math.min(Math.max(1, Number(nextPage || 1)), totalProductPages);
    setCurrentProductPage(safeNextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
            <p className="mt-1 text-sm text-gray-500">Tìm kiếm, thêm mới và cập nhật thông tin thuốc.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input 
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentProductPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentProductPage(1);
                }}
                className="rounded-md bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                Xóa tìm kiếm
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              <BsPlus className="text-xl" /> {showForm ? 'Ẩn form' : 'Thêm sản phẩm'}
            </button>
          </div>
        </div>
      </div>

        {/* Add/Edit Form */}
        {showForm && (
          <AdminProductForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            editing={!!editingId}
            measureUnitOptions={measureUnitOptions}
            onPriceChange={handlePriceChange}
            onAddPrice={handleAddPrice}
            onRemovePrice={handleRemovePrice}
            onSetDefaultPrice={handleSetDefaultPrice}
          />
        )}

        {/* Products Table */}
        {productsLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            Đang tải danh sách thuốc...
          </div>
        ) : (
          <AdminProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        {totalProducts > 0 && (
          <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-gray-600">
              Hiển thị {pageStartIndex}-{pageEndIndex} / {totalProducts} thuốc
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleProductPageChange(safeProductPage - 1)}
                disabled={safeProductPage === 1}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>

              {Array.from({ length: totalProductPages }, (_, index) => index + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalProductPages ||
                    Math.abs(page - safeProductPage) <= 2
                  );
                })
                .map((page, index, pages) => {
                  const previousPage = pages[index - 1];
                  const shouldShowGap = previousPage && page - previousPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {shouldShowGap && <span className="px-1 text-gray-400">...</span>}
                      <button
                        type="button"
                        onClick={() => handleProductPageChange(page)}
                        style={{ minWidth: 40 }}
                        className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                          safeProductPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => handleProductPageChange(safeProductPage + 1)}
                disabled={safeProductPage === totalProductPages}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {totalProducts === 0 && !showForm && !productsLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{searchTerm ? 'No products match your search.' : 'No products found. Click "Add Product" to get started.'}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Tổng sản phẩm</p>
            <p className="text-3xl font-bold text-blue-600">{totalProducts}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Average Rating</p>
            <p className="text-3xl font-bold text-green-600">
              {(products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : 0)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Tổng đánh giá</p>
            <p className="text-3xl font-bold text-purple-600">
              {products.reduce((sum, p) => sum + (p.reviews || 0), 0)}
            </p>
          </div>
        </div>
    </div>
  );
};

export default AdminScreen;
