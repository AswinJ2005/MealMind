const axios = require('axios');

const analyzeImage = async (req, res) => {
    // 1. Get the image URL from the request body.
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Missing imageUrl in request body.' });
    }

    // 2. Call our Python AI service.
    // In a production environment, 'http://localhost:5000' would be a real domain or an environment variable.
    const aiServiceUrl = 'http://localhost:5000/predict';

    try {
        console.log(`Forwarding request to AI service at ${aiServiceUrl}`);
        
        const response = await axios.post(aiServiceUrl, {
            image_url: imageUrl
        });

        // 3. For now, we will just return the data from the AI service.
        // In the future, we would add code here to save this data to the user's log in the database.
        
        console.log('Received response from AI service:', response.data);

        // 4. Send the nutrition data back to the client.
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error calling AI service:', error.message);
        // Pass along the error from the AI service if available
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ error: 'An internal error occurred while analyzing the image.' });
    }
};

module.exports = {
    analyzeImage,
};