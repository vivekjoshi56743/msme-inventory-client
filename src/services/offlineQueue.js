import localforage from 'localforage';

const QUEUE_KEY = 'sync-queue';

// Configure localforage to use IndexedDB. This is generally the default,
// but it's good practice to be explicit.
localforage.config({
  name: 'msme-inventory-lite',
  storeName: 'offline_actions',
  description: 'Queue for actions taken while offline.',
});

/**
 * Retrieves the current queue of offline actions from IndexedDB.
 * @returns {Promise<Array>} A promise that resolves to the current queue, or an empty array if none exists.
 */
export const getQueue = async () => {
  return (await localforage.getItem(QUEUE_KEY)) || [];
};

/**
 * Adds a new action to the offline queue.
 * Each action is given a unique ID and a 'pending' status.
 * @param {Object} action - The action to queue (e.g., { type: 'CREATE', payload: {...} }).
 * @returns {Promise<void>}
 */
export const addToQueue = async (action) => {
  const queue = await getQueue();
  const actionWithMeta = {
    ...action,
    id: self.crypto.randomUUID(), // Unique ID for each action
    status: 'pending',           // Initial status
    attempts: 0,                 // Retry counter
    timestamp: new Date().toISOString(),
  };
  queue.push(actionWithMeta);
  await localforage.setItem(QUEUE_KEY, queue);
  // Dispatch a custom event so the UI can react to queue changes
  window.dispatchEvent(new CustomEvent('queue-updated'));
};

/**
 * Removes a specific action from the queue by its unique ID.
 * This is called after an action has been successfully synced with the server.
 * @param {string} actionId - The unique ID of the action to remove.
 * @returns {Promise<void>}
 */
export const removeFromQueue = async (actionId) => {
  let queue = await getQueue();
  queue = queue.filter((item) => item.id !== actionId);
  await localforage.setItem(QUEUE_KEY, queue);
  window.dispatchEvent(new CustomEvent('queue-updated'));
};

/**
 * Updates a specific action in the queue.
 * Used to update status ('syncing', 'failed') and error messages for UI feedback.
 * @param {string} actionId - The unique ID of the action to update.
 * @param {Object} updates - An object containing the fields to update (e.g., { status: 'failed', error: '...' }).
 * @returns {Promise<void>}
 */
export const updateActionInQueue = async (actionId, updates) => {
  let queue = await getQueue();
  const actionIndex = queue.findIndex((action) => action.id === actionId);
  if (actionIndex !== -1) {
    queue[actionIndex] = { ...queue[actionIndex], ...updates };
    await localforage.setItem(QUEUE_KEY, queue);
    window.dispatchEvent(new CustomEvent('queue-updated'));
  }
};

/**
 * Clears the entire offline queue.
 * @returns {Promise<void>}
 */
export const clearQueue = async () => {
  await localforage.setItem(QUEUE_KEY, []);
  window.dispatchEvent(new CustomEvent('queue-updated'));
};

