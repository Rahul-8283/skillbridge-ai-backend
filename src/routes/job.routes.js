const express = require('express');
const jobController = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes for job list and details
router.get('/', jobController.getAllJobs);

// Matches and skill-gap
router.get('/matches/:userId', protect, jobController.getJobMatches);
router.get('/:jobId/skill-gap/:userId', protect, jobController.getSkillGap);

router.get('/:id', jobController.getJob);

// Applications
router.post('/:jobId/apply', protect, restrictTo('seeker'), jobController.applyToJob);
router.get('/:jobId/applications', protect, restrictTo('provider'), jobController.getJobApplications);

// Protected routes (Job Providers only for creating jobs)
router.post('/post', protect, restrictTo('provider'), jobController.createJob);

// Edit/Delete Job (providers)
router.put('/:id', protect, restrictTo('provider'), jobController.updateJob);
router.delete('/:id', protect, restrictTo('provider'), jobController.deleteJob);

// Update Job Application Status (providers)
router.put('/applications/:appId/status', protect, restrictTo('provider'), jobController.updateApplicationStatus);

module.exports = router;
