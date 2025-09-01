import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import * as offlineQueue from '../services/offlineQueue';

// This function contains the core logic for processing the offline queue.
const syncQueue = async () => {
  const queue = await offlineQueue.getQueue();
  if (queue.length === 0) {
    return; // Nothing to do
  }

  console.log(`Starting sync for ${queue.length} pending actions...`);
  // Dispatch a custom event to let the UI know a sync process has started.
  window.dispatchEvent(new CustomEvent('sync-started'));

  // Process each action in the queue one by one.
  for (const action of queue) {
    // Skip actions that are currently being processed by another sync attempt
    // or have failed too many times (e.g., 5 attempts).
    if (action.status === 'syncing' || (action.attempts || 0) >= 5) {
      continue;
    }

    // Mark the action as 'syncing' and increment the attempt counter.
    await offlineQueue.updateActionInQueue(action.id, {
      status: 'syncing',
      attempts: (action.attempts || 0) + 1,
    });

    try {
      // Perform the correct API call based on the action's type.
      switch (action.type) {
        case 'CREATE':
          await apiClient.post('/products', action.payload);
          break;
        case 'UPDATE':
          // The payload must include the ID, the fields that changed, and the version
          // to handle optimistic concurrency correctly.
          const { id, changedFields, version } = action.payload;
          await apiClient.put(`/products/${id}`, { ...changedFields, version });
          break;
        case 'DELETE':
          await apiClient.delete(`/products/${action.payload.id}`);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      // If the API call was successful, remove the action from the queue.
      await offlineQueue.removeFromQueue(action.id);
      console.log(`Action ${action.id} (${action.type}) synced successfully.`);
    } catch (error) {
      console.error(`Failed to sync action ${action.id}:`, error);
      // If the API call fails, mark the action as 'failed' in the queue
      // and store the error message so the UI can display it.
      await offlineQueue.updateActionInQueue(action.id, {
        status: 'failed',
        error: error.response?.data?.detail || 'A network error occurred during sync.',
      });
    }
  }

  console.log('Sync process finished.');
  window.dispatchEvent(new CustomEvent('sync-finished'));
};

/**
 * A custom hook that tracks the browser's online status and automatically
 * triggers the queue synchronization process when the connection is restored.
 * @returns {boolean} The current online status.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Use useCallback to prevent re-creating the function on every render.
  const handleSync = useCallback(async () => {
    // Prevent multiple syncs from running at the same time.
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    await syncQueue();
    setIsSyncing(false);
  }, [isSyncing]);

  useEffect(() => {
    // Functions to update state when browser network status changes.
    const handleOnline = () => {
      console.log('Network status: Online');
      setIsOnline(true);
      handleSync(); // Attempt to sync the queue immediately.
    };
    const handleOffline = () => {
      console.log('Network status: Offline');
      setIsOnline(false);
    };

    // Set up event listeners.
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run a sync check on initial load in case there are items in the queue.
    handleSync();

    // Cleanup function to remove listeners when the component unmounts.
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleSync]);

  return isOnline;
}

