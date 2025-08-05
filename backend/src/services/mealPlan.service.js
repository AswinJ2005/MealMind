// This file contains the core logic for calculating nutritional needs and generating meal plans.
const pool = require('../config/database');

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * BMR is the number of calories your body needs to function at rest.
 * @param {number} weightKg - User's weight in kilograms.
 * @param {number} heightCm - User's height in centimeters.
 * @param {number} age - User's age in years.
 * @returns {number} The calculated BMR.
 */
function calculateBMR(weightKg, heightCm, age) {
    // We are using the formula for men as a simplification for this project.
    // A production app would likely include gender as a parameter.
    // Male formula: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (years) + 5
    return (10 * parseFloat(weightKg)) + (6.25 * parseFloat(heightCm)) - (5 * age) + 5;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * TDEE is the total number of calories you burn in a day, including activity.
 * @param {number} bmr - The user's Basal Metabolic Rate.
 * @param {string} activityLevel - e.g., 'sedentary', 'lightly_active'.
 * @returns {number} The calculated TDEE.
 */
function calculateTDEE(bmr, activityLevel) {
    const activityMultipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
    };
    // Default to 'lightly_active' if an unknown value is provided.
    return bmr * (activityMultipliers[activityLevel] || 1.375);
}

/**
 * Adjusts calorie target based on fitness goals (e.g., creating a deficit for weight loss).
 * @param {number} tdee - The user's Total Daily Energy Expenditure.
 * @param {string} goal - e.g., 'weight_loss', 'muscle_gain', 'maintenance'.
 * @returns {number} The final daily calorie target.
 */
function adjustCaloriesForGoal(tdee, goal) {
    switch (goal) {
        case 'weight_loss':
            return tdee - 500; // Create a 500 calorie deficit per day.
        case 'muscle_gain':
            return tdee + 300; // Create a 300 calorie surplus per day.
        case 'maintenance':
        default:
            return tdee; // No adjustment needed.
    }
}

/**
 * Calculates target macronutrients based on total calories using a 40/30/30 split.
 * @param {number} targetCalories - The user's daily calorie goal.
 * @returns {{proteinGrams: number, carbsGrams: number, fatsGrams: number}} An object with macro targets in grams.
 */
function calculateMacros(targetCalories) {
    // Using a balanced macronutrient split: 40% Carbs, 30% Protein, 30% Fats.
    // Caloric values: 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal.
    
    const proteinGrams = Math.round((targetCalories * 0.30) / 4);
    const carbsGrams = Math.round((targetCalories * 0.40) / 4);
    const fatsGrams = Math.round((targetCalories * 0.30) / 9);

    return { proteinGrams, carbsGrams, fatsGrams };
}

/**
 * The main service function that generates a complete one-day meal plan for a user.
 * @param {string} userId - The Firebase UID of the user.
 * @returns {Promise<object>} The generated meal plan object.
 */
const generatePlanForUser = async (userId) => {
    // 1. Fetch user profile from the database to get their stats and goals.
    const userQuery = 'SELECT * FROM users WHERE firebase_uid = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
        throw new Error('User not found.');
    }
    const userProfile = userResult.rows[0];

    // Check if the user profile has all the necessary data.
    if (!userProfile.weight_kg || !userProfile.height_cm || !userProfile.age || !userProfile.activity_level || !userProfile.fitness_goal) {
        throw new Error('User profile is incomplete. Please update weight, height, age, activity level, and goal.');
    }
    
    // 2. Calculate their nutritional needs using our helper functions.
    const bmr = calculateBMR(userProfile.weight_kg, userProfile.height_cm, userProfile.age);
    const tdee = calculateTDEE(bmr, userProfile.activity_level);
    const targetCalories = Math.round(adjustCaloriesForGoal(tdee, userProfile.fitness_goal));
    const targetMacros = calculateMacros(targetCalories);

    console.log(`--- Nutritional Targets for User ${userId} ---`);
    console.log(`Target Calories: ${targetCalories}, Protein: ${targetMacros.proteinGrams}g, Carbs: ${targetMacros.carbsGrams}g, Fats: ${targetMacros.fatsGrams}g`);
    
    // 3. Query all available recipes AND calculate their total nutritional info.
    const allRecipesQuery = `
        SELECT 
            r.recipe_id, r.name,
            ROUND(SUM(f.calories_per_100g * ri.quantity_grams / 100)) AS total_calories,
            ROUND(SUM(f.protein_g_per_100g * ri.quantity_grams / 100)) AS total_protein,
            ROUND(SUM(f.carbs_g_per_100g * ri.quantity_grams / 100)) AS total_carbs,
            ROUND(SUM(f.fats_g_per_100g * ri.quantity_grams / 100)) AS total_fats
        FROM recipes r
        JOIN recipe_ingredients ri ON r.recipe_id = ri.recipe_id
        JOIN foods f ON ri.food_id = f.food_id
        GROUP BY r.recipe_id, r.name;
    `;
    const { rows: allRecipes } = await pool.query(allRecipesQuery);

    if (allRecipes.length < 3) {
        throw new Error('Not enough recipes in the database to generate a full day plan.');
    }
    
    // 4. Simple Greedy Algorithm to select meals (Breakfast, Lunch, Dinner)
    const dailyPlan = {};
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    let availableRecipes = [...allRecipes]; // Create a mutable copy

    for (const mealType of mealTypes) {
        let bestFitRecipe = null;
        let smallestDifference = Infinity;

        // Ideal calorie allocation per meal
        let mealCalorieTarget;
        if (mealType === 'breakfast') mealCalorieTarget = targetCalories * 0.30;
        else if (mealType === 'lunch') mealCalorieTarget = targetCalories * 0.40;
        else mealCalorieTarget = targetCalories * 0.30;

        for (const recipe of availableRecipes) {
            const difference = Math.abs(recipe.total_calories - mealCalorieTarget);
            if (difference < smallestDifference) {
                smallestDifference = difference;
                bestFitRecipe = recipe;
            }
        }
        
        if (bestFitRecipe) {
            dailyPlan[mealType] = bestFitRecipe;
            // Remove the selected recipe so it's not chosen for another meal on the same day.
            availableRecipes = availableRecipes.filter(r => r.recipe_id !== bestFitRecipe.recipe_id);
        }
    }
    
    // 5. Save the generated plan to the database.
    const today = new Date();
    const planQuery = `
        INSERT INTO meal_plans (user_id, start_date, end_date, target_calories, target_protein_g, target_carbs_g, target_fats_g)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING plan_id;
    `;
    const newPlanResult = await pool.query(planQuery, [userId, today, today, targetCalories, targetMacros.proteinGrams, targetMacros.carbsGrams, targetMacros.fatsGrams]);
    const planId = newPlanResult.rows[0].plan_id;

    for (const mealType in dailyPlan) {
        await pool.query(
            `INSERT INTO daily_meals (plan_id, meal_date, meal_type, recipe_id) VALUES ($1, $2, $3, $4);`,
            [planId, today, mealType, dailyPlan[mealType].recipe_id]
        );
    }
    console.log(`Saved new meal plan with ID: ${planId} for user ${userId}`);

    // 6. Return the fully generated plan to be sent to the user.
    return {
        planId: planId,
        targets: { calories: targetCalories, ...targetMacros },
        generatedPlan: dailyPlan,
    };
};

// Export the primary function so our controller can use it.
module.exports = {
    generatePlanForUser,
};