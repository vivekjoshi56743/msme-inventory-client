import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import Card from '../components/Card.jsx';
import LogoutButton from '../components/LogoutButton.jsx';
import ProductTable from '../components/ProductTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';
import CsvImportForm from '../components/CsvImportForm.jsx';

// A simple debounce hook to prevent API calls on every keystroke
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async () => {
    // Keep loading indicator for initial fetch, but not for subsequent filtering
    if (kpis === null) {
        setLoading(true);
    }
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const productsPromise = apiClient.get('/products', { params });
      
      // Only fetch KPIs on the very first load
      if (kpis === null) {
        const kpiPromise = apiClient.get('/dashboard/kpis');
        const [productsResponse, kpiResponse] = await Promise.all([productsPromise, kpiPromise]);
        setProducts(productsResponse.data);
        setKpis(kpiResponse.data);
      } else {
        const productsResponse = await productsPromise;
        setProducts(productsResponse.data);
      }

    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, categoryFilter, kpis]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = [...new Set(products.map(p => p.category))];

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = async (productData) => {
    setIsSaving(true);
    setError('');
    try {
      if (editingProduct) {
        const changedFields = {};
        for (const key in productData) {
          if (productData[key] !== editingProduct[key]) {
            changedFields[key] = productData[key];
          }
        }
        if (Object.keys(changedFields).length > 0) {
          const payload = { ...changedFields, version: editingProduct.version };
          await apiClient.put(`/products/${editingProduct.id}`, payload);
        }
      } else {
        await apiClient.post('/products', productData);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to save product.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setError('');
      try {
        await apiClient.delete(`/products/${productId}`);
        await fetchData();
      } catch (err) {
        setError('Failed to delete product. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative p-8">
        <LogoutButton />
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {loading && <p className="mt-4">Loading...</p>}
        {error && <p className="mt-4 p-4 text-center bg-red-100 text-red-700 rounded">{error}</p>}

        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card title="Total Items" value={kpis.total_items} />
            <Card title="Total Stock Value" value={`$${kpis.total_stock_value.toFixed(2)}`} />
            <Card title="Low Stock Items" value={kpis.low_stock_count} />
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">Inventory</h2>
              <p className="text-sm text-gray-500">Create, edit, and manage your products.</p>
            </div>
            <Button onClick={handleCreate}>Create Product</Button>
          </div>

          <CsvImportForm onImportSuccess={fetchData} />

          <div className="flex space-x-4 my-4 pt-4 border-t">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Create New Product'}>
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            isSaving={isSaving}
          />
        </Modal>
      </div>
    </div>
  );
}

export default DashboardPage;