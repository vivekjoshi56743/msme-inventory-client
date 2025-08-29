import React, { useState, useEffect } from 'react';
import Button from './Button';
import { useAuth } from '../hooks/AuthContext.jsx'; // 1. Import useAuth

function ProductForm({ product, onSave, onCancel, isSaving }) {
  const { currentUser } = useAuth(); // 2. Get the current user from our context
  const isStaff = currentUser?.role === 'staff'; // 3. Check if the user is staff

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    unit_price: 0.0,
  });

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    } else {
      setFormData({ name: '', sku: '', category: '', quantity: 0, unit_price: 0.0 });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = ['quantity', 'unit_price'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... other form fields remain the same ... */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">SKU</label>
        <input type="text" name="sku" value={formData.sku} onChange={handleChange} required disabled={!!product} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 disabled:cursor-not-allowed" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <input type="text" name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit Price</label>
          {/* 4. This input is now conditionally disabled */}
          <input 
            type="number" 
            name="unit_price" 
            value={formData.unit_price} 
            onChange={handleChange} 
            required 
            min="0" 
            step="0.01" 
            disabled={isStaff} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-gray-100 disabled:cursor-not-allowed" 
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default ProductForm;