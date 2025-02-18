// src/routes/openaiRoutes.js
const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openaiController');
const authenticateToken = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

router.post('/chat', authenticateToken, validationMiddleware.validateOpenAIChat, openaiController.chat);
router.post('/recommendations', validationMiddleware.validateRecommendations, openaiController.getRecommendations);

module.exports = router;
