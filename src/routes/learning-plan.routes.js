const express = require('express');
const learningPlanController = require('../controllers/learning-plan.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/learning-plan/generate', learningPlanController.generateRoadmap);
router.get('/user/:userId/learning-plans', learningPlanController.getLearningPlans);
router.get('/user/:userId/activities', learningPlanController.getActivities);
router.get('/user/:userId/achievements', learningPlanController.getAchievements);
router.get('/user/:userId/progress', learningPlanController.getProgressStats);

module.exports = router;
