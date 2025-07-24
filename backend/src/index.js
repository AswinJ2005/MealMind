// 1. Import Dependencies
require('dotenv').config(); // This loads the .env file contents into process.env
const express = require('express');
const { Pool } = require('pg'); // Use Pool for efficient connection management

// 2. Initialize Express App
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Setup PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 4. Define API Endpoints (Routes)
// A simple route to check if the server is running
app.get('/', (req, res) => {
    res.send('MealMind API server is running!');
});

// A route to test the database connection
app.get('/db-test', async (req, res) => {
    try {
        const client = await pool.connect(); // Get a client from the pool
        const result = await client.query('SELECT NOW()'); // Run a simple query
        res.json({
            message: 'Database connection successful!',
            dbTime: result.rows[0].now,
        });
        client.release(); // IMPORTANT: Release the client back to the pool
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Failed to connect to the database.' });
    }
});


// 5. Start the Server
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});