const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const { verifyFirebaseToken } = require('../middleware/auth.middleware');

// Protect all routes in this file with our authentication middleware.
router.use(verifyFirebaseToken);

// Define the route for analyzing an image.
// POST /api/v1/meals/analyze-image
router.post('/analyze-image', mealController.analyzeImage);

module.exports = router;