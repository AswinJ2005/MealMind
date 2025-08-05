const axios = require('axios');
const pool = require('../config/database'); // <-- Import the database pool

const analyzeImage = async (req, res) => {
    const { imageUrl } = req.body;
    const userUid = req.user.uid; // <-- Get user's ID from our auth middleware

    if (!imageUrl) {
        return res.status(400).json({ error: 'Missing imageUrl in request body.' });
    }

    const aiServiceUrl = 'http://localhost:5000/predict';

    try {
        // 1. Call the Python AI service
        console.log(`Forwarding request to AI service...`);
        const aiResponse = await axios.post(aiServiceUrl, {
            image_url: imageUrl
        });
        
        const analysis = aiResponse.data;
        console.log('Received response from AI service:', analysis);

        // --- NEW LOGIC: SAVE THE ANALYSIS RESULT ---
        if (analysis && analysis.prediction && !analysis.nutrition.error) {
            const { prediction, nutrition } = analysis;
            const insertQuery = `
                INSERT INTO food_logs (user_uid, food_name, calories, protein_g, carbohydrates_g, fats_g)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
            const values = [
                userUid,
                prediction.label,
                nutrition.calories_per_100g,
                nutrition.protein_g,
                nutrition.carbohydrates_g,
                nutrition.fats_g
            ];

            const { rows } = await pool.query(insertQuery, values);
            console.log('Successfully saved to food_logs:', rows[0]);
        }
        // --- END OF NEW LOGIC ---

        // 3. Send the nutrition data back to the client.
        res.status(200).json(analysis);

    } catch (error) {
        // ... (error handling remains the same)
        console.error('Error calling AI service:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ error: 'An internal error occurred while analyzing the image.' });
    }
};

module.exports = {
    analyzeImage,
};