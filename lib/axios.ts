import Axios from 'axios';

// NEXT_PUBLIC_API_BASE_URL may or may not include "/api/v1".
// Normalize so our instance baseURL ALWAYS ends with "/api/v1" exactly once.
function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  // Strip any trailing slashes
  let base = raw.replace(/\/$/, '');
  if (!/\/api\/v1$/.test(base)) {
    base = `${base}/api/v1`;
  }
  return base;
}

const axiosInstance = Axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    // Surface useful debug info in dev
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Axios error', {
        url: error?.config?.url,
        method: error?.config?.method,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


