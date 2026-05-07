import { useEffect, useState } from 'react';
import { fetchMedicinesAsProducts } from '../utils/productsApi';

const useFetch = (file) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (file === 'products') {
                try {
                    const products = await fetchMedicinesAsProducts();
                    setData(products);
                } catch (error) {
                    console.error('Error fetching products from API:', error);
                    setData([]);
                }
                return;
            }

            fetch(`/database/${file}.json`)
                .then(res => res.json())
                .then(data => setData(data))
                .catch(() => setData([]));
        };

        loadData();
    }, [file]);

    return [data]
}

export default useFetch
