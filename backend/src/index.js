// --- 1. SETUP & IMPORTS ---

// Load environment variables from the .env file.
// This should be the very first line to ensure variables are available everywhere.
require('dotenv').config();

// Initialize the Firebase Admin SDK connection.
require('./config/firebase');

// Import necessary modules.
const express = require('express');
const pool = require('./config/database'); // Import our centralized database pool.

// Import our route handlers.
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');


// --- 2. EXPRESS APP CONFIGURATION ---

// Create an instance of the Express application.
const app = express();
const PORT = process.env.PORT || 3001;


// --- MIDDLEWARE ---
// Middleware functions are executed in the order they are defined.

// This is the crucial middleware to parse incoming JSON payloads from request bodies.
// It MUST be defined before any routes that need to read `req.body`.
app.use(express.json());


// --- ROUTES ---
// We delegate route handling to our specialized router files.

// Any request starting with '/api/v1/auth' will be handled by our authRoutes file.
app.use('/api/v1/auth', authRoutes);

// Any request starting with '/api/v1/users' will be handled by our userRoutes file.
app.use('/api/v1/users', userRoutes);


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

// A catch-all route for any requests to endpoints that don't exist.
// A catch-all middleware for any requests to endpoints that don't exist.
// This MUST be the last `app.use` or `app.get/post` in the file.
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});


// Start the server and make it listen for incoming requests on the specified port.
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});