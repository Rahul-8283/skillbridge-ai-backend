const fastapi = require('../config/fastapi');
const FormData = require('form-data');
const fs = require('fs');

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
    const baseUrl = process.env.MODE_S === 'production' 
      ? process.env.FASTAPI_URL_PRO 
      : (process.env.FASTAPI_URL_DEV || 'http://127.0.0.1:8000');
    
    console.log('📁 Creating FormData with file:', filePath);
    console.log('🌐 FastAPI Base URL:', baseUrl);
    console.log('📌 MODE_S:', process.env.MODE_S);
    
    const form = new FormData();
    form.append('user_id', userId.toString());
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Resume file not found at path: ${filePath}`);
    }
    
    const fileStream = fs.createReadStream(filePath);
    form.append('file', fileStream, 'resume.pdf');

    const endpoint = `${baseUrl}/match-jobs`;
    console.log('🚀 Sending to FastAPI endpoint:', endpoint);
    
    const response = await fastapi.post('/match-jobs', form, {
      headers: form.getHeaders(),
      timeout: 180000, // 180 seconds for Render cold start
    });
    
    console.log('✅ FastAPI response received:', {
      status: response.status,
      statusText: response.statusText,
      hasMatches: !!response.data.matches,
      matchCount: response.data.matches?.length || 0
    });
    console.log('📊 Full FastAPI response:', JSON.stringify(response.data));
    return response.data; // { user_id, matches: [...] }
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    const fullErrorData = err.response?.data;
    
    console.error('❌ FastAPI matchJobs FAILED:', {
      httpStatus: err.response?.status,
      statusText: err.response?.statusText,
      errorMessage: errorMsg,
      fullErrorResponse: fullErrorData,
      requestURL: err.config?.url,
      requestMethod: err.config?.method,
      baseURL: err.config?.baseURL,
      errorCode: err.code,
      isTimeout: err.code === 'ECONNABORTED',
      isNetworkError: err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED'
    });
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
