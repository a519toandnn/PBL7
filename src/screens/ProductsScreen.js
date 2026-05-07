import React, { useState, useEffect } from 'react';
import Bounce from 'react-reveal/Bounce';
import Heading from '../components/Heading';
import Product from '../components/products/Product';
import useFetch from '../hooks/useFetch';
import { BsSearch } from 'react-icons/bs';

const ProductsScreen = () => {
    const [data] = useFetch('products');
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [localSearch, setLocalSearch] = useState('');

    // Đọc localStorage khi component mounted hoặc khi navigate tới trang này
    useEffect(() => {
        const term = localStorage.getItem('searchTerm');
        if (term) {
            setSearchTerm(term);
            setLocalSearch(term);
        }
    }, []);

    // Filter data khi data hoặc searchTerm thay đổi
    useEffect(() => {
        if (searchTerm.trim()) {
            // Nếu có searchTerm, lọc dữ liệu
            const filtered = data.filter(product =>
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        } else {
            // Nếu không có searchTerm, hiển thị tất cả
            setFilteredData(data);
        }
    }, [data, searchTerm]);

    // Xử lý thay đổi tìm kiếm trực tiếp ở trang products
    const handleLocalSearchChange = (value) => {
        setLocalSearch(value);
        
        if (!value.trim()) {
            // Nếu xóa hết → hiển thị tất cả sản phẩm
            setSearchTerm('');
            localStorage.removeItem('searchTerm');
            setFilteredData(data);
        } else {
            // Tìm kiếm với từ khóa mới
            setSearchTerm(value);
            const filtered = data.filter(product =>
                product.title.toLowerCase().includes(value.toLowerCase()) ||
                product.description.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }

    // Xóa localStorage khi rời khỏi trang
    const handleClearSearch = () => {
        localStorage.removeItem('searchTerm');
        setSearchTerm('');
        setLocalSearch('');
        setFilteredData(data);
    }

    const productsToDisplay = searchTerm ? filteredData : data;

    return (
        <section className="max-w-screen-xl py-24 mx-auto px-6">
            {/* heading  */}
            <Heading title={searchTerm ? `Tìm kiếm: "${searchTerm}"` : "Product"} />
            
            {/* Search Bar - Luôn hiển thị */}
            <div className="mb-8 flex items-center bg-white border-2 border-blue-600 rounded-lg px-3 py-2 shadow-md">
                <BsSearch className="text-blue-600 mr-3 w-5 h-5" />
                <input 
                    type="text"
                    value={localSearch}
                    onChange={(e) => handleLocalSearchChange(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="flex-grow h-10 px-2 outline-none text-gray-700 text-lg"
                />
                {localSearch && (
                    <button 
                        onClick={() => handleLocalSearchChange('')}
                        className="ml-2 text-gray-500 hover:text-red-600 font-bold text-xl flex items-center justify-center w-8 h-8 rounded"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
            
            {/* Search Bar - Chỉ hiển thị khi có searchTerm (deprecated, giữ để compatibility) */}
            {searchTerm && !localSearch && (
                <div className="mb-8 flex items-center bg-white border-2 border-blue-600 rounded-lg px-3 py-2 shadow-md">
                    <BsSearch className="text-blue-600 mr-3 w-5 h-5" />
                    <input 
                        type="text"
                        value={localSearch}
                        onChange={(e) => handleLocalSearchChange(e.target.value)}
                        placeholder="Tìm kiếm sản phẩm..."
                        className="flex-grow h-10 px-2 outline-none text-gray-700 text-lg"
                    />
                    {localSearch && (
                        <button 
                            onClick={() => handleLocalSearchChange('')}
                            className="ml-2 text-gray-500 hover:text-red-600 font-bold text-xl flex items-center justify-center w-8 h-8 rounded"
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}
            
            {productsToDisplay.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h2>
                    {searchTerm && <p className="text-gray-600 mt-2">
Không tìm thấy sản phẩm với từ khóa "{searchTerm}"</p>}
                    {searchTerm && (
                        <button 
                            onClick={handleClearSearch}
                            className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                        >
                            Xóa tìm kiếm
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {searchTerm && <p className="text-gray-600 mb-4">Tìm thấy {productsToDisplay.length} sản phẩm</p>}
                    {/* products  */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 py-6">
                        {productsToDisplay.map(product => (
                            <Bounce left key={product.id}>
                                <Product {...product} />
                            </Bounce>
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}

export default ProductsScreen
