import React, { useEffect, useMemo, useState } from 'react';
import { BsArrowLeft } from 'react-icons/bs';
import { Link, useHistory, useParams } from 'react-router-dom';
import swal from 'sweetalert';
import MedicineInfoTabs from '../components/products/detail/MedicineInfoTabs';
import ProductHero from '../components/products/detail/ProductHero';
import ProductMetaPanel from '../components/products/detail/ProductMetaPanel';
import useOrder from '../hooks/useOrder';
import useAuth from '../hooks/useAuth';
import {
    CONSULTATION_PRICE_TEXT,
    formatCurrency,
    getApiBaseUrl,
    needsPriceConsultation,
} from '../utils/productsApi';

const ProductDetailScreen = () => {
    const { title: slug } = useParams();
    const history = useHistory();
    const { handleCart } = useOrder();
    const { user } = useAuth();

    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(true);
    const [detailError, setDetailError] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!slug) return;

        let cancelled = false;

        const loadDetail = async () => {
            setDetailLoading(true);
            setDetailError('');
            setSelectedUnitId(null);
            setQuantity(1);

            try {
                const res = await fetch(`${getApiBaseUrl()}/medicines/${slug}`);
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.message || 'Không tải được chi tiết thuốc');
                }

                if (!cancelled) {
                    setDetail(json.data || json);
                }
            } catch (err) {
                if (!cancelled) {
                    setDetailError(err.message || 'Không tải được chi tiết thuốc');
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

    const prices = useMemo(() => {
        return Array.isArray(detail?.prices) ? detail.prices : [];
    }, [detail]);

    const defaultUnit = useMemo(() => {
        return prices.find((item) => item.is_sell_default) || prices[0] || null;
    }, [prices]);

    useEffect(() => {
        if (!defaultUnit) return;

        setSelectedUnitId((current) => {
            const currentStillExists = prices.some((item) => item.measure_id === current);
            return currentStillExists ? current : defaultUnit.measure_id;
        });
    }, [defaultUnit, prices]);

    const selectedUnit = useMemo(() => {
        return prices.find((item) => item.measure_id === selectedUnitId) || defaultUnit;
    }, [prices, selectedUnitId, defaultUnit]);

    const displayProduct = useMemo(() => {
        const primaryCategory =
            detail?.categories?.find((item) => item.is_primary) ||
            detail?.categories?.[0] ||
            null;

        return {
            id: detail?.id,
            name: detail?.name || 'Sản phẩm',
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

    const canShop = Boolean(user?.id || user?.email);

    const handleAddToCart = async () => {
        if (needsPriceConsultation(displayProduct.price)) {
            swal("Thông báo", "Sản phẩm này cần tư vấn từ dược sĩ trước khi mua", "info");
            return;
        }

        if (!canShop) {
            swal("Login Required", "Please sign in to add items to your cart", "info");
            history.push('/signin');
            return;
        }

        try {
            await handleCart(
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

            setQuantity(1);
            swal("Success", "Sản phẩm đã được thêm vào giỏ hàng", "success");
        } catch (error) {
            swal("Error", error.message || "Không thêm được sản phẩm vào giỏ hàng", "error");
        }
    };

    if (detailLoading) {
        return (
            <main className="max-w-screen-xl pt-8 pb-20 mx-auto px-6">
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

    if (detailError || !detail) {
        return (
            <main className="max-w-screen-xl pt-8 pb-20 mx-auto px-6">
                <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Không tìm thấy sản phẩm</h1>
                    <p className="mt-3 text-gray-500">
                        {detailError || 'Thông tin thuốc đang không khả dụng.'}
                    </p>
                    <Link to="/products" className="inline-flex items-center gap-2 mt-4 text-blue-600">
                        <BsArrowLeft />
                        Quay lại danh sách thuốc
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-screen-xl pt-8 pb-20 mx-auto px-6">
            <Link to="/products" className="inline-flex items-center gap-2 mb-6 text-blue-600">
                <BsArrowLeft />
                Quay lại
            </Link>

            <ProductHero
                product={displayProduct}
                selectedUnit={selectedUnit}
                onSelectUnit={setSelectedUnitId}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                disabled={false}
                canShop={canShop}
                needsPriceConsultation={needsPriceConsultation}
                consultationText={CONSULTATION_PRICE_TEXT}
                formatCurrency={formatCurrency}
            />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
                <ProductMetaPanel product={displayProduct} />
                <MedicineInfoTabs
                    medicalInfo={displayProduct.medicalInfo}
                    productName={displayProduct.name}
                />
            </div>
        </main>
    );
};

export default ProductDetailScreen;
