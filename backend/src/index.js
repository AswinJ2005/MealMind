require('dotenv').config();
require('./config/firebase');
const express = require('express');
const pool = require('./config/database'); // <-- IMPORT THE POOL
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// MIDDLEWARE
app.use(express.json());

// ROUTES
app.use('/api/v1/auth', authRoutes);

// DB TEST ROUTE
app.get('/db-test', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        res.json({ message: 'DB Test Successful', dbTime: result.rows[0].now });
        client.release();
    } catch (err) {
        res.status(500).json({ error: 'DB Connection Failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});