// --- 1. SETUP & IMPORTS ---

// Load environment variables from the .env file.
// This must be the first line to ensure variables are available everywhere.
require('dotenv').config();

// Initialize the Firebase Admin SDK connection.
require('./config/firebase');

// Import necessary modules.
const express = require('express');
const pool = require('./config/database'); // Import our centralized database pool.

// Import our route handlers for different features.
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const mealPlanRoutes = require('./routes/mealPlan.routes'); // <-- The newly added routes


// --- 2. EXPRESS APP CONFIGURATION ---

// Create an instance of the Express application.
const app = express();
const PORT = process.env.PORT || 3001;


// --- MIDDLEWARE ---
// Middleware functions are executed in order. This order is important.

// This is the crucial middleware to parse incoming JSON payloads from request bodies.
app.use(express.json());


// --- ROUTES ---
// We delegate route handling to our specialized router files based on the URL prefix.

// Handle all authentication-related requests (e.g., /register)
app.use('/api/v1/auth', authRoutes);

// Handle all user-profile-related requests (e.g., /me)
app.use('/api/v1/users', userRoutes);

// Handle all meal-plan-related requests (e.g., /generate)
app.use('/api/v1/meal-plans', mealPlanRoutes);


// --- 3. DIAGNOSTIC & SERVER START ---

// A simple diagnostic route to quickly test the database connection.
app.get('/db-test', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        res.json({ message: 'DB Test Successful', dbTime: result.rows[0].now });
        client.release(); // Important: release the client back to the pool
    } catch (err) {
        console.error('Database connection test failed:', err);
        res.status(500).json({ error: 'DB Connection Failed' });
    }
});

// A catch-all middleware for any requests to endpoints that don't exist.
// This MUST be the last `app.use` or `app.get/post` in the file.
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});


// Start the server and listen for incoming requests on the specified port.
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});