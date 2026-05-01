const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/signup', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL_DEV}/login` }),
  authController.googleCallback
);

// Route to set role for pending Google OAuth users
router.post('/set-role', protect, authController.setRole);

// Route to get current user details
router.get('/me', protect, authController.getMe);

module.exports = router;
