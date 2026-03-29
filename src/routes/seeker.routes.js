const express = require('express');
const seekerController = require('../controllers/seeker.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// All routes here require being logged in and being a seeker
router.use(protect);
router.use(restrictTo('seeker'));

// Seeker Profile
router.get('/profile', seekerController.getProfile);
router.post('/profile', seekerController.upsertProfile);
router.put('/profile', seekerController.upsertProfile);

// Resumes
router.get('/resume', seekerController.getResumes);
router.get('/resumes', seekerController.getResumes);
router.post('/resume/upload', upload.single('resume'), seekerController.uploadResume);
router.delete('/resume/:id', seekerController.deleteResume);

// Job Matching
router.get('/jobs/matches', seekerController.getJobMatches);

// Job Applications
router.get('/applications', seekerController.getApplications);
router.post('/applications', seekerController.applyForJob);
router.get('/applications/:id', seekerController.getApplicationDetails);

module.exports = router;
