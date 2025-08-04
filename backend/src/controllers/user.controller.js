const pool = require('../config/database');

/**
 * Gets the profile of the currently logged-in user.
 * The user's information is available in `req.user` thanks to our middleware.
 */
const getMyProfile = async (req, res) => {
    try {
        const firebaseUid = req.user.uid; // Get UID from the middleware-provided user object

        const query = 'SELECT firebase_uid, email, display_name, age, weight_kg, height_cm, activity_level, fitness_goal FROM users WHERE firebase_uid = $1';
        const { rows } = await pool.query(query, [firebaseUid]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
};

/**
 * Updates the profile of the currently logged-in user.
 */
const updateMyProfile = async (req, res) => {
    try {
        const firebaseUid = req.user.uid; // Get UID from middleware
        const { displayName, age, weightKg, heightCm, activity_level, fitnessGoal } = req.body;

        const query = `
            UPDATE users
            SET 
                display_name = $1,
                age = $2,
                weight_kg = $3,
                height_cm = $4,
                activity_level = $5,
                fitness_goal = $6,
                updated_at = NOW()
            WHERE firebase_uid = $7
            RETURNING *;
        `;
        const values = [displayName, age, weightKg, heightCm, activity_level, fitnessGoal, firebaseUid];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found, could not update.' });
        }

        res.status(200).json({ message: 'Profile updated successfully!', user: rows[0] });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile.' });
    }
};


module.exports = {
    getMyProfile,
    updateMyProfile,
};