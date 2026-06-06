// const DEFAULT_API_URL = 'http://localhost:3001';

// export const getApiBaseUrl = () => {
//   const envUrl = process.env.REACT_APP_API_URL?.trim();
//   return envUrl || DEFAULT_API_URL;
// };

// export const mapMedicineToProduct = (medicine) => ({
//   id: medicine.id,
//   title: medicine.name,
//   image: medicine.image_url || '/assets/products/product1.jpg',
//   description: medicine.description || '',
//   price: medicine.price ?? 0,
//   rating: medicine.rating ?? 4,
//   reviews: medicine.reviews ?? 0,
//   category: medicine.category || medicine.product_type || '',
//   manufacturer: medicine.manufacturer || '',
//   usage: medicine.usage || '',
//   slug: medicine.slug,
// });

// export const fetchMedicinesAsProducts = async () => {
//   // 15 second timeout (cho backend request xong)
//   const timeoutPromise = new Promise((_, reject) =>
//     setTimeout(() => reject(new Error('API timeout')), 15000)
//   );

//   const fetchPromise = fetch(`${getApiBaseUrl()}/medicines?limit=1000`).then(
//     async (response) => {
//       if (!response.ok) {
//         throw new Error(`API error ${response.status}`);
//       }
//       return response.json();
//     }
//   );

//   try {
//     const json = await Promise.race([fetchPromise, timeoutPromise]);
    
//     // Response format: { success, statusCode, data: { data: [...], pagination: {...} }, ... }
//     const responseData = json?.data;
    
//     let medicines = [];
//     if (Array.isArray(responseData)) {
//       medicines = responseData;
//     } else if (Array.isArray(responseData?.data)) {
//       medicines = responseData.data;
//     }

//     console.log('✅ Loaded medicines from API:', medicines.length);
//     return medicines.map(mapMedicineToProduct);
//   } catch (error) {
//     console.warn('⚠️ API slow, fetching from fallback JSON...');
//     throw error; // Let useFetch handle fallback
//   }
// };
// ⭐ CHANGE — chỉ lấy 200 sp thay vì 1000 (frontend chỉ hiển thị batch)
const DEFAULT_API_URL = 'http://localhost:3001';
const PRODUCTS_LIMIT = 200; // ⭐ NEW

export const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL?.trim();
  return envUrl || DEFAULT_API_URL;
};

export const formatCurrency = (value) => {
  const numberValue = Number(value || 0);
  return `${numberValue.toLocaleString('vi-VN')}đ`;
};

export const CONSULTATION_PRICE_TEXT = 'Cần tư vấn từ dược sĩ';

export const needsPriceConsultation = (value) => {
  const numberValue = Number(value);
  return !Number.isFinite(numberValue) || numberValue <= 0;
};

export const mapMedicineToProduct = (medicine) => ({
  id: medicine.id,
  title: medicine.name,
  image: medicine.image_url || '/assets/products/product1.jpg',
  description: medicine.description || '',
  price: medicine.price ?? 0,
  measureUnitName: medicine.measure_unit_name || medicine.measure_name || '',
  rating: medicine.rating ?? 4,
  reviews: medicine.reviews ?? 0,
  category: medicine.category || medicine.product_type || '',
  manufacturer: medicine.manufacturer || '',
  usage: medicine.usage || '',
  slug: medicine.slug,
});

export const fetchMedicinesAsProducts = async () => {

  // ⭐ NEW — abort nếu fetch quá lâu (tránh treo)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {

    console.log("🚀 Fetch medicines from API...");

    // 🔄 CHANGE — giảm limit xuống 200
    const response = await fetch(
      `${getApiBaseUrl()}/medicines?limit=${PRODUCTS_LIMIT}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const json = await response.json();

    // chuẩn hóa response backend
    const responseData = json?.data;
    
    let medicines = [];
    if (Array.isArray(responseData)) {
      medicines = responseData;
    } else if (Array.isArray(responseData?.data)) {
      medicines = responseData.data;
    }

    console.log(`✅ Loaded ${medicines.length} medicines`);

    // ⭐ NEW — map, sort by id ASC, then return
    return medicines
      .map(mapMedicineToProduct)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  } catch (error) {

    // ⭐ NEW — log rõ lý do lỗi
    if (error.name === "AbortError") {
      console.warn("⏱ API request timeout");
    } else {
      console.warn("⚠️ API error:", error.message);
    }

    // throw để useFetch fallback cache/json
    throw error;
  }
};
