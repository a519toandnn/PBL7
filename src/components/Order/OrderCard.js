import React from 'react';
import { MdDeleteOutline } from 'react-icons/md';
import Bounce from 'react-reveal/Bounce';
import useOrder from '../../hooks/useOrder';

const OrderCard = (props) => {
    const { title, image, price, quantity = 1 } = props;
    const { removeProduct, updateQuantity } = useOrder();
    const totalPrice = (price * quantity).toFixed(2);

    return (
        <Bounce left>
            <div className="flex space-x-5 bg-gray-50 rounded-xl p-4 transition transfrom hover:scale-105 hover:shadow-xl duration-700">
                {/* image  */}
                <div>
                    <img className="w-40" src={image} alt={title} />
                </div>
                {/* details  */}
                <div className="flex flex-col justify-between flex-grow">
                    <h1 className="text-lg poppins text-gray-700">{title}</h1>
                    {/* price  */}
                    <div>
                        <h2 className="text-gray-900 font-bold poppins text-2xl">${price}</h2>
                    </div>
                    {/* Quantity Control */}
                    <div className="flex items-center space-x-3 mt-2">
                        <button 
                            onClick={() => updateQuantity(props.id, quantity - 1)}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            −
                        </button>
                        <input 
                            type="number" 
                            min="1"
                            value={quantity} 
                            onChange={(e) => updateQuantity(props.id, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center border border-gray-300 rounded py-1"
                        />
                        <button 
                            onClick={() => updateQuantity(props.id, quantity + 1)}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            +
                        </button>
                    </div>
                </div>
                {/* delete  */}
                <div>
                    <MdDeleteOutline className="text-2xl text-gray-600 cursor-pointer" onClick={() => removeProduct(props.id)} />
                </div>
            </div>
        </Bounce>
    )
}

export default OrderCard
