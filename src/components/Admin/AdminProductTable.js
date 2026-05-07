import React from 'react';
import { AiFillDelete, AiFillEdit } from 'react-icons/ai';

const AdminProductTable = ({ products, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Table view for md+ */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Product Name</th>
              <th className="px-6 py-4 text-left">Category</th>
              <th className="px-6 py-4 text-left">Price</th>
              <th className="px-6 py-4 text-left">Manufacturer</th>
              <th className="px-6 py-4 text-left">Rating</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-semibold text-gray-900">{product.title}</td>
                <td className="px-6 py-4 text-gray-600">{product.category}</td>
                <td className="px-6 py-4 text-gray-900 font-bold">{product.price}</td>
                <td className="px-6 py-4 text-gray-600">{product.manufacturer}</td>
                <td className="px-6 py-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">⭐ {product.rating}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-800 mr-4 text-xl" title="Edit">
                    <AiFillEdit />
                  </button>
                  <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-800 text-xl" title="Delete">
                    <AiFillDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card view for small screens */}
      <div className="md:hidden p-4">
        <div className="grid grid-cols-1 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-600">{product.category} • {product.manufacturer}</p>
                  <p className="text-base font-bold text-gray-900 mt-2">{product.price}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">⭐ {product.rating}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-800 text-xl" title="Edit">
                      <AiFillEdit />
                    </button>
                    <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-800 text-xl" title="Delete">
                      <AiFillDelete />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminProductTable;
