import React, { useEffect, useMemo, useState } from 'react';
import { BsChevronDown, BsChevronRight, BsSearch } from 'react-icons/bs';
import Heading from '../components/Heading';
import Product from '../components/products/Product';
import {
    fetchCategories,
    fetchCategoryProductPage,
    fetchMedicinePage,
    PRODUCTS_PAGE_SIZE,
    searchMedicinePage,
} from '../utils/productsApi';

const flattenCategoryChildren = (categories, level = 0) => {
    return categories.reduce((items, category) => {
        const current = { ...category, level };
        const children = Array.isArray(category.children)
            ? flattenCategoryChildren(category.children, level + 1)
            : [];

        return [...items, current, ...children];
    }, []);
};

const buildCategoryGroups = (categories) => {
    const preferredSlugs = ['thuoc', 'thuc-pham-chuc-nang'];
    const preferredGroups = preferredSlugs
        .map((slug) => categories.find((category) => category.slug === slug))
        .filter(Boolean);
    const otherGroups = categories.filter((category) => !preferredSlugs.includes(category.slug));

    return [...preferredGroups, ...otherGroups].map((group) => ({
        ...group,
        items: flattenCategoryChildren(group.children || []),
    }));
};

export const getProductPaginationPages = (currentPage, totalPages) => {
    const safeTotalPages = Math.max(1, Number(totalPages || 1));
    const safeCurrentPage = Math.min(
        Math.max(1, Number(currentPage || 1)),
        safeTotalPages
    );

    return Array.from({ length: safeTotalPages }, (_, index) => index + 1).filter((pageNumber) => (
        pageNumber === 1 ||
        pageNumber === safeTotalPages ||
        Math.abs(pageNumber - safeCurrentPage) <= 2
    ));
};

const ProductsScreen = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: PRODUCTS_PAGE_SIZE,
        totalPages: 1,
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [openGroups, setOpenGroups] = useState({
        thuoc: true,
        'thuc-pham-chuc-nang': true,
    });

    const categoryGroups = useMemo(() => buildCategoryGroups(categories), [categories]);

    useEffect(() => {
        const term = localStorage.getItem('searchTerm') || '';
        setSearchTerm(term);
        setLocalSearch(term);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadCategories = async () => {
            setCategoriesLoading(true);

            try {
                const data = await fetchCategories({ signal: controller.signal });
                setCategories(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setCategories([]);
                }
            } finally {
                setCategoriesLoading(false);
            }
        };

        loadCategories();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const keyword = searchTerm.trim();

        const loadProducts = async () => {
            setLoading(true);
            setError('');

            try {
                const payload = keyword
                    ? await searchMedicinePage({
                        q: keyword,
                        page,
                        limit: 5,
                        signal: controller.signal,
                    })
                    : selectedCategory
                    ? await fetchCategoryProductPage({
                        slug: selectedCategory.slug,
                        page,
                        limit: PRODUCTS_PAGE_SIZE,
                        signal: controller.signal,
                    })
                    : await fetchMedicinePage({
                        page,
                        limit: PRODUCTS_PAGE_SIZE,
                        signal: controller.signal,
                    });

                setProducts(payload.products);
                setPagination(payload.pagination);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setProducts([]);
                    setError(err.message || 'Không tải được sản phẩm');
                }
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(loadProducts, keyword ? 300 : 0);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [page, selectedCategory, searchTerm]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page, selectedCategory]);

    const handleLocalSearchChange = (value) => {
        setLocalSearch(value);
        setPage(1);

        if (!value.trim()) {
            setSearchTerm('');
            localStorage.removeItem('searchTerm');
            return;
        }

        setSearchTerm(value);
        localStorage.setItem('searchTerm', value);
    };

    const handleClearSearch = () => {
        localStorage.removeItem('searchTerm');
        setSearchTerm('');
        setLocalSearch('');
        setPage(1);
    };

    const handleSelectCategory = (category) => {
        setPage(1);
        setSelectedCategory((current) => {
            return current?.slug === category.slug ? null : category;
        });
    };

    const toggleGroup = (slug) => {
        setOpenGroups((current) => ({
            ...current,
            [slug]: current[slug] === false,
        }));
    };

    const totalPages = Math.max(1, Number(pagination.totalPages || 1));
    const currentPage = Math.min(Number(pagination.page || page), totalPages);
    const pageNumbers = useMemo(
        () => getProductPaginationPages(currentPage, totalPages),
        [currentPage, totalPages]
    );

    const handlePageChange = (nextPage) => {
        const safeNextPage = Math.min(Math.max(1, Number(nextPage || 1)), totalPages);
        setPage(safeNextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const heading = selectedCategory ? `Danh mục: ${selectedCategory.name}` : 'Product';

    return (
        <section className="max-w-screen-xl pt-8 pb-24 mx-auto px-6">
            <Heading title={searchTerm ? `Tìm kiếm: "${searchTerm}"` : heading} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1">
                    <div className="bg-white border border-gray-100 rounded-lg p-5 lg:sticky lg:top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Danh mục</h2>
                            {selectedCategory && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setPage(1);
                                    }}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Bỏ chọn
                                </button>
                            )}
                        </div>

                        {categoriesLoading ? (
                            <p className="text-gray-500">Đang tải danh mục...</p>
                        ) : categoryGroups.length === 0 ? (
                            <p className="text-gray-500">Chưa có danh mục.</p>
                        ) : (
                            <div className="space-y-5">
                                {categoryGroups.map((group) => (
                                    <div key={group.slug || group.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.slug)}
                                            className="w-full bg-blue-50 px-4 py-3 flex items-center justify-between text-left"
                                        >
                                            <h3 className="font-bold text-blue-700">{group.name}</h3>
                                            {openGroups[group.slug] === false ? (
                                                <BsChevronRight className="text-blue-700 flex-shrink-0" />
                                            ) : (
                                                <BsChevronDown className="text-blue-700 flex-shrink-0" />
                                            )}
                                        </button>

                                        {openGroups[group.slug] === false ? null : group.items.length === 0 ? (
                                            <p className="px-4 py-3 text-sm text-gray-500">Chưa có danh mục con.</p>
                                        ) : (
                                            <div className="divide-y divide-gray-100 overflow-y-auto" style={{ maxHeight: '360px' }}>
                                                {group.items.map((category) => (
                                                    <label
                                                        key={category.slug || category.id}
                                                        className="flex items-start gap-3 px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-50"
                                                        style={{ paddingLeft: `${16 + category.level * 12}px` }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategory?.slug === category.slug}
                                                            onChange={() => handleSelectCategory(category)}
                                                            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded flex-shrink-0"
                                                        />
                                                        <span className="font-medium leading-6 flex-1">{category.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <div className="lg:col-span-3">
                    <div className="mb-6 flex items-center bg-white border-2 border-blue-600 rounded-lg px-3 py-2 shadow-md">
                        <BsSearch className="text-blue-600 mr-3 w-5 h-5" />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => handleLocalSearchChange(e.target.value)}
                            placeholder="Tìm kiếm thuốc..."
                            className="flex-grow h-10 px-2 outline-none text-gray-700 text-lg"
                        />
                        {localSearch && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="ml-2 text-gray-500 hover:text-red-600 font-bold text-xl"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <p className="text-gray-600">
                            {selectedCategory
                                ? `Đang xem ${selectedCategory.name}`
                                : 'Tất cả sản phẩm'}
                            {pagination.total ? ` · ${pagination.total} sản phẩm` : ''}
                        </p>
                        <p className="text-gray-500">
                            Trang {currentPage}/{totalPages}
                        </p>
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold">Đang tải sản phẩm...</h2>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-12 bg-white border border-gray-100 rounded-lg">
                            <h2 className="text-2xl font-bold text-gray-800">Lỗi tải sản phẩm</h2>
                            <p className="mt-2 text-gray-600">{error}</p>
                            <button
                                type="button"
                                onClick={() => setPage(1)}
                                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg"
                            >
                                Tải lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && products.length === 0 && (
                        <div className="text-center py-12 bg-white border border-gray-100 rounded-lg">
                            <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm</h2>
                            <p className="mt-2 text-gray-600">
                                Thử bỏ tìm kiếm hoặc chọn danh mục khác.
                            </p>
                        </div>
                    )}

                    {!loading && !error && products.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 py-4">
                                {products.map((product) => (
                                    <div key={product.id}>
                                        <Product {...product} />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>

                                {pageNumbers.map((pageNumber, index) => {
                                    const previousPage = pageNumbers[index - 1];
                                    const shouldShowGap = previousPage && pageNumber - previousPage > 1;

                                    return (
                                        <React.Fragment key={pageNumber}>
                                            {shouldShowGap && (
                                                <span className="px-1 text-gray-400">...</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handlePageChange(pageNumber)}
                                                style={{ minWidth: 40 }}
                                                className={`h-10 rounded-lg border px-3 font-semibold ${
                                                    pageNumber === currentPage
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-700 hover:border-blue-500'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}

                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductsScreen;
