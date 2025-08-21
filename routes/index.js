const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page - Landing page
router.get('/', forwardAuthenticated, (req, res) => {
  res.render('welcome');
});

// Dashboard - After login
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.user
  });
});

module.exports = router;