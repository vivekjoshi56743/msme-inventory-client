import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Your FastAPI server URL
});

// We will add an interceptor here later to automatically add the auth token
export default apiClient;