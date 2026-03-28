const express = require('express');
const jobController = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes for job list and details
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJob);

// Protected routes (Job Providers only for creating jobs)
router.post('/post', protect, restrictTo('provider'), jobController.createJob);

module.exports = router;
