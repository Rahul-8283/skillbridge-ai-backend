const express = require('express');
const authRoutes = require('./auth.routes');
const seekerRoutes = require('./seeker.routes');
const providerRoutes = require('./provider.routes');
const jobRoutes = require('./job.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/seeker', seekerRoutes);
router.use('/provider', providerRoutes);
router.use('/jobs', jobRoutes);

module.exports = router;
