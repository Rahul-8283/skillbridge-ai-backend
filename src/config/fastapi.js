const axios = require('axios');

const getBaseUrl = () => {
  let url = process.env.MODE_S === 'production' 
    ? process.env.FASTAPI_URL_PRO 
    : (process.env.FASTAPI_URL_DEV || 'http://127.0.0.1:8000');
  if (url && url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

// Create axios instance for FastAPI communication
const fastapi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 180000, // 3 minutes for Render cold starts
});

// Interceptor to dynamically update baseURL on each request
fastapi.interceptors.request.use(config => {
  config.baseURL = getBaseUrl();
  return config;
});

module.exports = fastapi;
