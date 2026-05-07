import React, { useState, useEffect } from 'react';
import Bounce from 'react-reveal/Bounce';
import useFetch from '../../hooks/useFetch';
import Heading from '../Heading';
import Product from './Product';

const Products = () => {
    const [data] = useFetch('products');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        // Lấy từ localStorage
        const savedSearchTerm = localStorage.getItem('searchTerm') || '';
        setSearchTerm(savedSearchTerm);
    }, []);

    useEffect(() => {
        // Lọc sản phẩm dựa trên searchTerm
        if (!searchTerm.trim()) {
            // Nếu không có từ tìm kiếm, hiển thị 6 sản phẩm đầu
            setFilteredProducts(data.slice(0, 6));
        } else {
            // Tìm kiếm sản phẩm chứa từ khóa (không phân biệt hoa/thường)
            const filtered = data.filter(product =>
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, data]);
    
    return (
        <section className="max-w-screen-xl mx-auto px-6 py-6 pb-24">
            {/* heading  */}
            <Heading title={searchTerm ? `Kết quả tìm kiếm: "${searchTerm}"` : "Products"} />
            
            {/* products  */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 py-6">
                    {filteredProducts.map(product => (
                        <Bounce left key={product.id}>
                            <Product {...product} />
                        </Bounce>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Không có sản phẩm cần tìm</h2>
                    <p className="text-gray-600 text-lg">
                        Không tìm thấy sản phẩm với từ khóa <span className="font-bold text-blue-600">"{searchTerm}"</span>
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('searchTerm');
                            setSearchTerm('');
                        }}
                        className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                    >
                        Xóa tìm kiếm
                    </button>
                </div>
            )}
                
        </section>
    )
}

export default Products
