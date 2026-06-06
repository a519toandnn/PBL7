import React, { useState } from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { BsCart2 } from 'react-icons/bs';
import Rating from 'react-rating';
import { useHistory } from 'react-router-dom';
import swal from 'sweetalert';
import useAuth from '../../hooks/useAuth';
import useOrder from '../../hooks/useOrder';
import { CONSULTATION_PRICE_TEXT, formatCurrency, needsPriceConsultation } from '../../utils/productsApi';
import Button from '../Form/Button';

const Product = (props) => {
    const [quantity, setQuantity] = useState(1);
    const { title, image, description, price, reviews, rating, measureUnitName } = props;
    const history = useHistory();
    const { handleCart } = useOrder();
    const { user } = useAuth();
    const canShop = Boolean(user?.id || user?.email);
    const shouldConsultPrice = needsPriceConsultation(price);

    const handleAddToCart = async () => {
        if (shouldConsultPrice) {
            swal("Thông báo", "Sản phẩm này cần tư vấn từ dược sĩ trước khi mua", "info");
            return;
        }

        if (!canShop) {
            swal("Login Required", "Please sign in to add items to your cart", "info");
            history.push('/signin');
            return;
        }
        
        try {
            await handleCart(props, quantity);
            setQuantity(1);
            swal("Wow!!!", "Your order has added to the cart", "success");
        } catch (error) {
            swal("Error", error.message || "Khong them duoc san pham vao gio hang", "error");
        }
    };

    const handleViewDetail = () => {
        if (!props.slug) {
            swal("Thong bao", "San pham chua co slug de xem chi tiet", "info");
            return;
        }

        history.push(`/products/${props.slug}`);
    };

    return (
        <div className="flex flex-col bg-white border border-gray-200 hover:shadow-xl transition duration-700 ease-in-out transform hover:scale-105 p-4 box-border rounded-xl">
            <img className="w-full h-56 object-contain mb-4" src={image} alt={title} />
            <h1 className="text-gray-900 poppins text-lg font-semibold leading-snug">{title}</h1>
            <p className="text-gray-500 leading-6 mt-2 flex-grow">{description.slice(0, 92)}</p>

            {/* price  */}
            <div className="mt-4">
                {shouldConsultPrice ? (
                    <p className="text-blue-700 font-bold leading-6">{CONSULTATION_PRICE_TEXT}</p>
                ) : (
                    <h2 className="text-blue-700 font-bold poppins text-2xl">
                        {formatCurrency(price)}
                        {measureUnitName && (
                            <span className="text-base font-medium text-blue-600"> / {measureUnitName}</span>
                        )}
                    </h2>
                )}
            </div>
            {/* rating  */}
            <div className="flex items-center space-x-2">
                <Rating
                    emptySymbol={<AiOutlineStar className="text-gray-600 text-xl" />}
                    fullSymbol={<AiFillStar className="text-yellow-400 text-xl" />}
                    initialRating={`${rating}`}
                    readonly
                />
                <span className="text-gray-600">({reviews})</span>
            </div>
            <div>

            </div>
            {/* Quantity input */}
            {canShop && !shouldConsultPrice && (
                <div className="flex items-center space-x-2 w-full">
                    <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        −
                    </button>
                    <input 
                        type="number" 
                        min="1"
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center border border-gray-300 rounded py-1"
                    />
                    <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        +
                    </button>
                </div>
            )}
            {/* buttons */}
            <div className="flex items-center space-x-3 mt-4">
                {canShop && !shouldConsultPrice && (
                    <>
                        <button
                            className="btn-primary h-10 px-3 poppins text-sm font-semibold inline-flex items-center justify-center gap-2 text-center"
                            onClick={handleAddToCart}
                        >
                            <BsCart2 className="text-base" />
                            <span>Add To Cart</span>
                        </button>
                    </>
                )}
               
                <Button className="w-36 btn-primary py-3 px-2 poppins text-sm" text="View" onClick={handleViewDetail} />
            </div>

        </div>

    )
}

export default Product
