// Import the core logic from our service file
const mealPlanService = require('../services/mealPlan.service');

/**
 * Controller to handle the meal plan generation request.
 */
const generateMealPlan = async (req, res) => {
    try {
        // The user's ID is attached to the request object by our auth middleware
        const userId = req.user.uid; 

        console.log(`Received request to generate meal plan for user: ${userId}`);
        
        // Call our sophisticated service function to do the heavy lifting
        const plan = await mealPlanService.generatePlanForUser(userId);
        
        // Send the successful response back to the client
        res.status(201).json({
            message: "Meal plan generated successfully!",
            data: plan
        });

    } catch (error) {
        // If anything goes wrong in the service, catch the error and send a useful response
        console.error('Meal plan generation failed:', error.message);

        // Send a 400 Bad Request for user-fixable errors (like incomplete profile)
        if (error.message.includes('incomplete')) {
             return res.status(400).json({ error: error.message });
        }
        
        // Otherwise, send a 500 Internal Server Error
        res.status(500).json({ error: 'Failed to generate meal plan due to an internal server error.' });
    }
};

module.exports = {
    generateMealPlan,
};