import React from 'react';
import { BsCheck } from 'react-icons/bs';
import { MdDeleteOutline } from 'react-icons/md';
import Bounce from 'react-reveal/Bounce';
import swal from 'sweetalert';
import useOrder from '../../hooks/useOrder';
import {
    CONSULTATION_PRICE_TEXT,
    formatCurrency,
    needsPriceConsultation,
} from '../../utils/productsApi';

const OrderCard = (props) => {
    const {
        title,
        image,
        price,
        quantity = 1,
        selected = false,
        onSelect,
        measureUnitName,
        unitName,
    } = props;
    const { removeProduct, updateQuantity } = useOrder();
    const shouldConsultPrice = needsPriceConsultation(price);

    const handleQuantityChange = async (nextQuantity) => {
        try {
            await updateQuantity(props.cartKey, nextQuantity);
        } catch (error) {
            swal('Error', error.message || 'Khong cap nhat duoc gio hang', 'error');
        }
    };

    const handleRemove = async () => {
        try {
            await removeProduct(props.cartKey);
        } catch (error) {
            swal('Error', error.message || 'Khong xoa duoc san pham khoi gio hang', 'error');
        }
    };

    return (
        <Bounce left>
            <div
                className={`flex items-center gap-4 bg-white border rounded-lg p-3 transition hover:shadow-md ${
                    selected ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'
                }`}
            >
                <label className="relative flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onSelect}
                        className="sr-only"
                    />
                    <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                            selected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 hover:border-blue-500'
                        }`}
                    >
                        {selected && <BsCheck className="text-lg" />}
                    </span>
                </label>

                <div className="w-24 h-24 bg-gray-50 rounded-md flex items-center justify-center flex-shrink-0">
                    <img className="max-w-full max-h-full object-contain" src={image} alt={title} />
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="text-base poppins font-semibold text-gray-800 leading-snug">
                        {title}
                    </h1>

                    <div className="mt-2">
                        {shouldConsultPrice ? (
                            <h2 className="text-blue-700 font-bold poppins text-sm">
                                {CONSULTATION_PRICE_TEXT}
                            </h2>
                        ) : (
                            <h2 className="text-gray-900 font-bold poppins text-xl">
                                {formatCurrency(price)}
                            </h2>
                        )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                        <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => handleQuantityChange(quantity - 1)}
                                className="w-8 h-8 bg-gray-50 hover:bg-gray-100 font-bold text-gray-700"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) =>
                                    handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-12 h-8 text-center border-l border-r border-gray-300 outline-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => handleQuantityChange(quantity + 1)}
                                className="w-8 h-8 bg-gray-50 hover:bg-gray-100 font-bold text-gray-700"
                            >
                                +
                            </button>
                        </div>
                        {(measureUnitName || unitName) && (
                            <span className="rounded-md bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                                {measureUnitName || unitName}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    className="w-9 h-9 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center flex-shrink-0"
                    onClick={handleRemove}
                    title="Remove"
                >
                    <MdDeleteOutline className="text-2xl" />
                </button>
            </div>
        </Bounce>
    );
};

export default OrderCard;
