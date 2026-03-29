const express = require('express');
const providerController = require('../controllers/provider.controller');
const jobController = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes here require being logged in and being a provider
router.use(protect);
router.use(restrictTo('provider'));

router.get('/profile', providerController.getProfile);
router.post('/profile', providerController.upsertProfile);
router.put('/profile', providerController.upsertProfile);

// Job management
router.post('/jobs', jobController.createJob);

// Dashboard and candidate management
router.get('/my-jobs', providerController.getMyJobs);
router.get('/candidates', providerController.getCandidates);
router.put('/candidates/status', providerController.updateCandidateStatus);

module.exports = router;
