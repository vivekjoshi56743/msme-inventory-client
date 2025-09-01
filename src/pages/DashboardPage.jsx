import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import localforage from 'localforage';

// Component Imports
import Card from '../components/Card.jsx';
import LogoutButton from '../components/LogoutButton.jsx';
import ProductTable from '../components/ProductTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';
import CsvImportForm from '../components/CsvImportForm.jsx';
import OfflineSimulator from '../components/OfflineSimulator.jsx';

// Custom Hook and Offline Service Imports
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import * as offlineQueue from '../services/offlineQueue.js';

// A simple debounce hook to prevent API calls on every keystroke
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// A new component to display the status of the offline queue
function OfflineQueueStatus({ queue, onRetry, onDiscard }) {
    if (queue.length === 0) return null;

    return (
        <div className="my-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold text-gray-700">Pending Offline Changes ({queue.length})</h3>
            <ul className="mt-2 text-sm space-y-2">
                {queue.map(action => (
                    <li key={action.id} className={`p-2 rounded ${action.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-semibold">{action.type}</span>: {action.payload.name || `ID ${action.payload.id}`}
                                {action.status === 'failed' && <p className="text-red-600">Error: {action.error}</p>}
                            </div>
                            {action.status === 'failed' && (
                                <div className="space-x-2">
                                    <Button onClick={() => onRetry(action.id)} className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1">Retry</Button>
                                    <Button onClick={() => onDiscard(action.id)} className="bg-gray-400 hover:bg-gray-500 text-xs px-2 py-1">Discard</Button>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
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

  // --- New state for offline functionality ---
  const isOnline = useOnlineStatus();
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // ** FIX: Wrap refreshQueue in useCallback **
  const refreshQueue = useCallback(async () => {
    const queue = await offlineQueue.getQueue();
    setSyncQueue(queue);
  }, []);

  // ** FIX: Wrap fetchData in useCallback **
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isOnline) {
        // ONLINE: Fetch from API and update cache
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        
        const productsPromise = apiClient.get('/products', { params });
        const kpiPromise = apiClient.get('/dashboard/kpis');
        
        const [productsResponse, kpiResponse] = await Promise.all([productsPromise, kpiPromise]);
        
        setProducts(productsResponse.data);
        setKpis(kpiResponse.data);

        await localforage.setItem('products', productsResponse.data);
        await localforage.setItem('kpis', kpiResponse.data);

      } else {
        // OFFLINE: Load from cache
        setError('You are offline. Showing cached data.');
        const [cachedProducts, cachedKpis] = await Promise.all([
            localforage.getItem('products'),
            localforage.getItem('kpis')
        ]);
        if (cachedProducts) setProducts(cachedProducts);
        if (cachedKpis) setKpis(cachedKpis);
      }
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, debouncedSearchTerm, categoryFilter]);


  // Effect to listen for queue and sync status changes
  useEffect(() => {
    refreshQueue(); // Initial queue load

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncFinish = () => {
        setIsSyncing(false);
        fetchData(); // Refresh data after sync
        refreshQueue();
    };

    window.addEventListener('queue-updated', refreshQueue);
    window.addEventListener('sync-started', handleSyncStart);
    window.addEventListener('sync-finished', handleSyncFinish);

    return () => {
        window.removeEventListener('queue-updated', refreshQueue);
        window.removeEventListener('sync-started', handleSyncStart);
        window.removeEventListener('sync-finished', handleSyncFinish);
    };
  }, [refreshQueue, fetchData]);
  
  // Effect to fetch data when filters or online status change
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
    if (!isOnline) {
        if (editingProduct) { // UPDATE
            const changedFields = {};
            Object.keys(productData).forEach(key => {
                if (productData[key] !== editingProduct[key]) {
                    changedFields[key] = productData[key];
                }
            });
            if (Object.keys(changedFields).length > 0) {
                await offlineQueue.addToQueue({ type: 'UPDATE', payload: { id: editingProduct.id, version: editingProduct.version, changedFields }});
            }
        } else { // CREATE
            await offlineQueue.addToQueue({ type: 'CREATE', payload: productData });
        }
        setIsModalOpen(false);
        // Here you could add optimistic UI updates if desired
        return;
    }

    setIsSaving(true);
    setError('');
    try {
        if (editingProduct) {
            const changedFields = {};
            Object.keys(productData).forEach(key => {
                if (productData[key] !== editingProduct[key]) {
                    changedFields[key] = productData[key];
                }
            });
            if (Object.keys(changedFields).length > 0) {
                 await apiClient.put(`/products/${editingProduct.id}`, { ...changedFields, version: editingProduct.version });
            }
        } else {
            await apiClient.post('/products', productData);
        }
        setIsModalOpen(false);
        await fetchData(); // Refresh data from server
    } catch (err) {
        const errorMessage = err.response?.data?.detail || 'Failed to save product.';
        setError(errorMessage);
        // Here you would handle the concurrency conflict modal
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!isOnline) {
        await offlineQueue.addToQueue({ type: 'DELETE', payload: { id: productId } });
        // Optimistic UI update
        setProducts(prev => prev.filter(p => p.id !== productId));
        return;
    }

    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${productId}`);
        await fetchData();
      } catch (err) {
        setError('Failed to delete product.');
        console.error(err);
      }
    }
  };

  const handleRetryAction = async (actionId) => {
    await offlineQueue.updateActionInQueue(actionId, { status: 'pending', attempts: 0 });
    // Trigger a sync immediately
    window.dispatchEvent(new Event('online'));
  };

  const handleDiscardAction = async (actionId) => {
    await offlineQueue.removeFromQueue(actionId);
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative p-8">
        <LogoutButton />
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {!isOnline && <div className="mt-2 p-2 text-center bg-yellow-200 text-yellow-800 rounded-md">You are currently offline. Some features may be limited.</div>}
        {isSyncing && <div className="mt-2 p-2 text-center bg-blue-200 text-blue-800 rounded-md">Syncing offline changes...</div>}


        {loading && <p className="mt-4">Loading...</p>}
        {error && !loading && <p className="mt-4 p-4 text-center bg-red-100 text-red-700 rounded">{error}</p>}

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

          <OfflineQueueStatus queue={syncQueue} onRetry={handleRetryAction} onDiscard={handleDiscardAction} />

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
        
        <OfflineSimulator />
      </div>
    </div>
  );
}

export default DashboardPage;

