import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import Card from '../components/Card.jsx';
import LogoutButton from '../components/LogoutButton.jsx';
import ProductTable from '../components/ProductTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';

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
  // ... (keep all the existing state variables for kpis, products, etc.)
  const [kpis, setKpis] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- New State for Search and Filter ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

  const fetchData = useCallback(async () => {
    // No setLoading(true) here to avoid UI flicker on every search/filter
    setError('');
    try {
      // Fetch products with search and filter params
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (categoryFilter) params.append('category', categoryFilter);

      const productsResponse = await apiClient.get('/products', { params });
      setProducts(productsResponse.data);

      // We only need to fetch KPIs on the initial load
      if (kpis === null) {
        const kpiResponse = await apiClient.get('/dashboard/kpis');
        setKpis(kpiResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, categoryFilter, kpis]); // Depend on debounced search and filter

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract unique categories for the filter dropdown
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
        // Update logic
        const payload = { ...productData, version: editingProduct.version };
        await apiClient.put(`/products/${editingProduct.id}`, payload);
      } else {
        // Create logic
        await apiClient.post('/products', productData);
      }
      setIsModalOpen(false);
      await fetchData(); // Refresh data after saving
    } catch (err) {
      setError('Failed to save product. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setError('');
      try {
        await apiClient.delete(`/products/${productId}`);
        await fetchData(); // Refresh data after deleting
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

        {loading && kpis === null && <p className="mt-4">Loading...</p>}
        {error && <p className="mt-4 p-4 text-center bg-red-100 text-red-700 rounded">{error}</p>}

        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card title="Total Items" value={kpis.total_items} />
            <Card title="Total Stock Value" value={`$${kpis.total_stock_value.toFixed(2)}`} />
            <Card title="Low Stock Items" value={kpis.low_stock_count} />
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Inventory</h2>
            <Button onClick={handleCreate}>Create Product</Button>
          </div>

          {/* --- New Search and Filter UI --- */}
          <div className="flex space-x-4 mb-4">
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