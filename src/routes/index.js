const express = require('express');
const authRoutes = require('./auth.routes');
const seekerRoutes = require('./seeker.routes');
const jobRoutes = require('./job.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/seeker', seekerRoutes);
router.use('/jobs', jobRoutes);

module.exports = router;
