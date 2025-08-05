// This script is for development use only to populate the database with initial data.
const path = require('path');

// Correctly locate the .env file at the root of the `/backend` directory
// __dirname is the current folder (`/scripts`), so `../.env` points to `/backend/.env`
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const pool = require('../src/config/database');

const seedData = async () => {
    let client; // Define client outside the try block so it can be used in finally
    try {
        console.log('Attempting to connect to the database...');
        client = await pool.connect(); // Get a single connection from the pool
        console.log('Database connection successful. Starting to seed...');

        // Clear existing data in the correct order to respect foreign key constraints
        console.log('Clearing existing tables...');
        await client.query('TRUNCATE TABLE daily_meals, meal_plans, recipe_ingredients, recipes, foods RESTART IDENTITY CASCADE;');
        console.log('All tables cleared.');

        // --- 1. SEED FOODS ---
        const foods = [
            // Proteins
            { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
            { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fats: 13 },
            { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fats: 11 },
            { name: 'Tofu (Firm)', calories: 76, protein: 8, carbs: 1.9, fats: 4.8 },
            // Carbs
            { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fats: 0.9 },
            { name: 'Quinoa', calories: 120, protein: 4.1, carbs: 21, fats: 1.9 },
            { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
            // Vegetables
            { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11.2, fats: 0.6 },
            { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
            { name: 'Bell Pepper (Red)', calories: 31, protein: 1, carbs: 6, fats: 0.3 },
            // Fats
            { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fats: 15 },
            { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fats: 100 },
            // Fruits
            { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
            { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fats: 0.3 }
        ];

        for (const food of foods) {
            await client.query(
                'INSERT INTO foods (name, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fats_g_per_100g) VALUES ($1, $2, $3, $4, $5)',
                [food.name, food.calories, food.protein, food.carbs, food.fats]
            );
        }
        console.log('Seeded "foods" table with 14 items.');

        // --- 2. SEED RECIPES & INGREDIENTS ---
        // Since we are clearing the tables and using SERIAL primary keys, the first recipe_id will be 1, the second 2, etc.

        // Recipe 1: Grilled Chicken and Quinoa
        await client.query(
            `INSERT INTO recipes (name, description, instructions) VALUES ($1, $2, $3)`,
            ['Grilled Chicken & Quinoa Bowl', 'A balanced and high-protein meal.', '1. Grill 150g chicken breast. 2. Cook 100g quinoa. 3. Steam 100g broccoli. 4. Combine in a bowl.']
        );
        // Ingredients for Recipe 1 (Chicken, Quinoa, Broccoli)
        await client.query(`INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams) VALUES (1, 1, 150), (1, 6, 100), (1, 8, 100);`);

        // Recipe 2: Scrambled Eggs on Sweet Potato
        await client.query(
            `INSERT INTO recipes (name, description, instructions) VALUES ($1, $2, $3)`,
            ['Scrambled Eggs on Sweet Potato', 'A nutrient-dense breakfast.', '1. Slice 150g sweet potato and toast. 2. Scramble 2 eggs (approx 100g). 3. Serve eggs on top of sweet potato with 50g sliced avocado.']
        );
        // Ingredients for Recipe 2 (Eggs, Sweet Potato, Avocado)
        await client.query(`INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams) VALUES (2, 3, 100), (2, 7, 150), (2, 11, 50);`);

        // Recipe 3: Salmon with Roasted Vegetables
        await client.query(
             `INSERT INTO recipes (name, description, instructions) VALUES ($1, $2, $3)`,
            ['Roasted Salmon with Veggies', 'A healthy dinner rich in omega-3s.', '1. Season 150g salmon fillet. 2. Chop 100g bell pepper. 3. Drizzle with 10g olive oil and roast at 200°C for 15-20 minutes.']
        );
        // Ingredients for Recipe 3 (Salmon, Bell Pepper, Olive Oil)
        await client.query(`INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams) VALUES (3, 2, 150), (3, 10, 100), (3, 12, 10);`);

        
        console.log('Seeded "recipes" and "recipe_ingredients" tables with 3 recipes.');

        console.log('✅ Database seeding completed successfully! ✅');

    } catch (error) {
        console.error('❌ Error during database seeding:', error);
    } finally {
        // Ensure the client and pool are always closed
        if (client) {
            client.release(); // Release the client back to the pool
            console.log('Database client released.');
        }
        pool.end(); // Close all connections in the pool
        console.log('Database pool closed.');
    }
};

// Run the seeder function
seedData();