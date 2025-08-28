import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import Card from '../components/Card.jsx';
import LogoutButton from '../components/LogoutButton.jsx';
import ProductTable from '../components/ProductTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';

function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [kpiResponse, productsResponse] = await Promise.all([
        apiClient.get('/dashboard/kpis'),
        apiClient.get('/products')
      ]);
      setKpis(kpiResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Inventory</h2>
            <Button onClick={handleCreate}>Create Product</Button>
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