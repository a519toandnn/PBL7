import React from 'react';

const AdminProductForm = ({ formData, onChange, onSubmit, onCancel, editing }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {editing ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input
          type="text"
          name="title"
          placeholder="Product Title *"
          value={formData.title}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />

        <input
          type="text"
          name="slug"
          placeholder="Slug (auto generated if empty)"
          value={formData.slug}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <select
          name="product_type"
          value={formData.product_type}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="DRUG">DRUG</option>
          <option value="SUPPLEMENT">SUPPLEMENT</option>
          <option value="OTHER">OTHER</option>
        </select>

        <input
          type="text"
          name="category"
          placeholder="Category name (display only)"
          value={formData.category}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <input
          type="text"
          name="category_ids"
          placeholder="Category IDs, e.g. 3, 8"
          value={formData.category_ids}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <input
          type="text"
          name="image_url"
          placeholder="Image URL"
          value={formData.image_url}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <textarea
          name="description"
          placeholder="Product Description *"
          value={formData.description}
          onChange={onChange}
          rows="4"
          className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />

        <input
          type="text"
          name="price"
          placeholder="Price (VND) *"
          value={formData.price}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />

        <input
          type="number"
          name="measure_unit_id"
          min="1"
          placeholder="Measure Unit ID *"
          value={formData.measure_unit_id}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />

        <input
          type="text"
          name="manufacturer"
          placeholder="Manufacturer"
          value={formData.manufacturer}
          onChange={onChange}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <textarea
          name="usage"
          placeholder="Usage Instructions"
          value={formData.usage}
          onChange={onChange}
          rows="2"
          className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Rating (1-5)</label>
          <input
            type="number"
            name="rating"
            min="1"
            max="5"
            value={formData.rating}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Number of Reviews</label>
          <input
            type="number"
            name="reviews"
            min="0"
            value={formData.reviews}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2 flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            {editing ? 'Update Product' : 'Add Product'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
