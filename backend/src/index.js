// --- 1. SETUP & IMPORTS ---

// Load environment variables from the .env file.
require('dotenv').config();

// Initialize the Firebase Admin SDK connection.
require('./config/firebase');

// Import necessary modules.
const express = require('express');
const pool = require('./config/database');
const cors = require('cors'); // <-- IMPORT CORS

// Import all of our application's route handlers.
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const mealRoutes = require('./routes/meal.routes');


// --- 2. EXPRESS APP CONFIGURATION ---

const app = express();
const PORT = process.env.PORT || 3001;


// --- MIDDLEWARE ---
// The order of middleware is crucial. They are executed sequentially.

// Enable Cross-Origin Resource Sharing (CORS) for all routes.
// This allows our frontend at localhost:3000 to make requests to our backend at localhost:3001.
app.use(cors()); // <-- ADD THIS LINE

// This is the middleware to parse incoming JSON payloads from request bodies.
app.use(express.json());


// --- ROUTES ---
// We delegate route handling based on the initial path segment.

app.use('/api/v1/auth', authRoutes);     // Handles /register, /login, etc.
app.use('/api/v1/users', userRoutes);    // Handles /users/me, etc.
app.use('/api/v1/meals', mealRoutes);    // Handles /meals/analyze-image, etc.


// --- 3. DIAGNOSTIC & SERVER START ---

// A diagnostic route to test the database connection.
app.get('/db-test', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        res.json({ message: 'DB Test Successful', dbTime: result.rows[0].now });
        client.release();
    } catch (err) {
        console.error('Database connection test failed:', err);
        res.status(500).json({ error: 'DB Connection Failed' });
    }
});

// A catch-all middleware for any requests to endpoints that don't exist.
// This MUST be the last route handler in the file.
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});


// Start the server.
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});