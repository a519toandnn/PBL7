// import { useEffect, useState } from 'react';
// import { fetchMedicinesAsProducts } from '../utils/productsApi';

// const useFetch = (file) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         const loadData = async () => {
//             setLoading(true);
//             setError(null);
            
//             if (file === 'products') {
//                 try {
//                     const products = await fetchMedicinesAsProducts();
//                     setData(products);
//                     setLoading(false);
//                 } catch (error) {
//                     console.error('Error fetching products from API:', error);
//                     setError(error.message);
                    
//                     // Fallback: try to load from local JSON
//                     try {
//                         const res = await fetch(`/database/products.json`);
//                         const localData = await res.json();
//                         setData(localData);
//                         setError(null);
//                         console.log('✅ Using fallback JSON:', localData.length);
//                     } catch (fallbackError) {
//                         setData([]);
//                     }
//                     setLoading(false);
//                 }
//                 return;
//             }

//             fetch(`/database/${file}.json`)
//                 .then(res => res.json())
//                 .then(data => {
//                     setData(data);
//                     setLoading(false);
//                 })
//                 .catch((err) => {
//                     setError(err.message);
//                     setData([]);
//                     setLoading(false);
//                 });
//         };

//         loadData();
//     }, [file]);

//     return [data, loading, error]
// }

// export default useFetch
import { useEffect, useState } from 'react';
import { fetchMedicinesAsProducts } from '../utils/productsApi';

const useFetch = (file) => {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            // ⭐ NEW — cache localStorage
            const CACHE_KEY = "products_cache";

            if (file === 'products') {
                try {

                    // ⭐ NEW — load cache trước (hiển thị ngay lập tức)
                    const cached = localStorage.getItem(CACHE_KEY);
                    if (cached) {
                        console.log("⚡ Load products từ cache");
                        setData(JSON.parse(cached));
                        setLoading(false);
                    }

                    // 🔄 CHANGE — vẫn gọi API để cập nhật data mới
                    const products = await fetchMedicinesAsProducts();
                    setData(products);

                    // ⭐ NEW — lưu cache
                    localStorage.setItem(CACHE_KEY, JSON.stringify(products));

                    setLoading(false);

                } catch (error) {
                    console.error('Error fetching products from API:', error);
                    setError(error.message);
                    setLoading(false);
                }

                return;
            }

            // load json bình thường
            fetch(`/database/${file}.json`)
                .then(res => res.json())
                .then(data => {
                    setData(data);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err.message);
                    setData([]);
                    setLoading(false);
                });
        };

        loadData();
    }, [file]);

    return [data, loading, error]
}

export default useFetch;