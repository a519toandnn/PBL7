const DEFAULT_API_URL = 'http://localhost:3001';

export const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL?.trim();
  return envUrl || DEFAULT_API_URL;
};

export const mapMedicineToProduct = (medicine) => ({
  id: medicine.id,
  title: medicine.name,
  image: medicine.image_url || '/assets/products/product1.jpg',
  description: medicine.description || '',
  price: medicine.price ?? 0,
  rating: medicine.rating ?? 4,
  reviews: medicine.reviews ?? 0,
  category: medicine.category || medicine.product_type || '',
  manufacturer: medicine.manufacturer || '',
  usage: medicine.usage || '',
  slug: medicine.slug,
});

export const fetchMedicinesAsProducts = async () => {
  const response = await fetch(`${getApiBaseUrl()}/medicines?limit=100`);

  if (!response.ok) {
    throw new Error(`Failed to fetch medicines: ${response.status}`);
  }

  const data = await response.json();
  const medicines = Array.isArray(data) ? data : data?.data || [];

  return medicines.map(mapMedicineToProduct);
};