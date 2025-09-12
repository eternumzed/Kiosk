const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register
router.post('/register', userController.user_register_post);

// Login
router.post('/login', userController.user_login_post);

module.exports = router;
