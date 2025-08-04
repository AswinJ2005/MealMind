// Import required modules
const pool = require('../config/database'); // <-- THIS IS THE ONLY LINE THAT CHANGED
const admin = require('../config/firebase');

/**
 * Handles new user registration.
 * 1. Validates incoming data.
 * 2. Creates a new user in Firebase Authentication.
 * 3. Saves the new user's profile information to the PostgreSQL database.
 * 4. Responds to the client with the created user data or an error.
 */
const register = async (req, res) => {
    // 1. Get user data from the request body
    const {
        email,
        password,
        displayName,
        age,
        weightKg,
        heightCm,
        activityLevel,
        fitnessGoal
    } = req.body;

    // 2. Validate essential data
    if (!req.body || !email || !password) {
        return res.status(400).json({
            error: "Request body is missing required fields (email, password)."
        });
    }

    try {
        // 3. Create a new user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName,
        });

        // 4. Get the unique firebase_uid from the newly created user record
        const firebaseUid = userRecord.uid;

        // 5. Save the user's complete profile data to our PostgreSQL database
        const newUserQuery = `
            INSERT INTO users (
                firebase_uid, email, display_name, age,
                weight_kg, height_cm, activity_level, fitness_goal
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        // The values must be in the same order as the columns and $ parameters
        const values = [
            firebaseUid,
            email,
            displayName,
            age || null,
            weightKg || null,
            heightCm || null,
            activityLevel || null,
            fitnessGoal || null
        ];

        const { rows } = await pool.query(newUserQuery, values);

        // 6. Respond to the client with a success message and the created user data
        return res.status(201).json({
            message: "User registered successfully!",
            user: rows[0],
        });

    } catch (error) {
        // 7. Handle potential errors gracefully
        console.error("Registration Error in auth.controller.js:", error);

        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'The email address is already in use by another account.' });
        } else if (error.code === 'auth/invalid-password') {
            return res.status(400).json({ error: 'The password must be a string with at least six characters.' });
        }

        // Generic error for any other failures
        return res.status(500).json({ error: 'Failed to register user due to an internal server error.' });
    }
};

// Export the register function so it can be used in our routes
module.exports = {
    register,
};