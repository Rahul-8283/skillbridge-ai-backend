const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const getBaseUrl = () => {
  let url = process.env.MODE_S === 'production' 
    ? process.env.FASTAPI_URL_PRO 
    : (process.env.FASTAPI_URL_DEV || 'http://127.0.0.1:8000');
  if (url && url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

const fastapi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000, // 2 minutes for Render cold starts
});

fastapi.interceptors.request.use(config => {
  config.baseURL = getBaseUrl();
  return config;
});

exports.healthCheck = async () => {
  try {
    const response = await fastapi.get('/health');
    return response.data;
  } catch (err) {
    console.error('FastAPI healthCheck error:', err.response?.data || err.message);
    throw err;
  }
};

exports.createJob = async (jobData) => {
  try {
    const response = await fastapi.post('/create-job', jobData);
    return response.data;
  } catch (err) {
    console.error('FastAPI createJob error:', err.response?.data || err.message);
    throw err;
  }
};

exports.getJobs = async () => {
  try {
    const response = await fastapi.get('/jobs');
    return response.data;
  } catch (err) {
    console.error('FastAPI getJobs error:', err.response?.data || err.message);
    throw err;
  }
};

exports.getJobById = async (jobId) => {
  try {
    const response = await fastapi.get(`/job/${jobId}`);
    return response.data;
  } catch (err) {
    console.error('FastAPI getJobById error:', err.response?.data || err.message);
    throw err;
  }
};

exports.matchJobs = async (userId, filePath) => {
  try {
    const form = new FormData();
    form.append('user_id', userId.toString());
    form.append('file', fs.createReadStream(filePath));

    const response = await fastapi.post('/match-jobs', form, {
      headers: form.getHeaders(),
    });
    return response.data; // { user_id, matches: [...] }
  } catch (err) {
    console.error('FastAPI matchJobs error:', err.response?.data || err.message);
    throw err;
  }
};

exports.generateRoadmap = async (roadmapData) => {
  try {
    const response = await fastapi.post('/generate-roadmap', roadmapData);
    return response.data;
  } catch (err) {
    console.error('FastAPI generateRoadmap error:', err.response?.data || err.message);
    throw err;
  }
};
