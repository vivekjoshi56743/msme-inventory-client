import React from 'react';
import Button from './Button';

function ProductTable({ products, onEdit, onDelete }) {
  if (!products || products.length === 0) {
    return <p className="text-gray-500">No products found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
            <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="py-4 px-6 whitespace-nowrap">{product.name}</td>
              <td className="py-4 px-6 whitespace-nowrap">{product.sku}</td>
              <td className="py-4 px-6 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {product.category}
                </span>
              </td>
              <td className="py-4 px-6 whitespace-nowrap">{product.quantity}</td>
              <td className="py-4 px-6 whitespace-nowrap">${product.unit_price.toFixed(2)}</td>
              <td className="py-4 px-6 whitespace-nowrap text-right space-x-2">
                <Button onClick={() => onEdit(product)} className="bg-yellow-500 hover:bg-yellow-600">Edit</Button>
                <Button onClick={() => onDelete(product.id)} className="bg-red-600 hover:bg-red-700">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;