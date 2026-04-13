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
    if (!fs.existsSync(filePath)) {
      throw new Error(`Resume file not found at path: ${filePath}`);
    }
    
    const form = new FormData();
    form.append('user_id', userId.toString());
    form.append('file', fs.createReadStream(filePath));

    const response = await fastapi.post('/match-jobs', form, {
      headers: form.getHeaders(),
      timeout: 180000,
    });
    
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message;
    
    if (errorMsg.includes('NoneType') || errorMsg.includes('session')) {
      console.error('❌ Neo4j database connection issue - Database may be offline or credentials incorrect');
    } else {
      console.error('❌ FastAPI matching failed:', errorMsg);
    }
    
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
