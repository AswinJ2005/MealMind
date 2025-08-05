const express = require('express');
const router = express.Router();
const mealPlanController = require('../controllers/mealPlan.controller');
const { verifyFirebaseToken } = require('../middleware/auth.middleware');

// All routes in this file are protected and require a valid token
router.use(verifyFirebaseToken);

/**
 * @route   POST /api/v1/meal-plans/generate
 * @desc    Generate a new 1-day meal plan for the authenticated user
 * @access  Private
 */
router.post('/generate', mealPlanController.generateMealPlan);


module.exports = router;