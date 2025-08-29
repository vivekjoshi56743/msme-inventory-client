import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_PROD_BASE_URL, // Your FastAPI server URL
});

// We will add an interceptor here later to automatically add the auth token
export default apiClient;