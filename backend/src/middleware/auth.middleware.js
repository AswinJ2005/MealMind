const admin = require('../config/firebase');

/**
 * Middleware to verify a Firebase ID token from the Authorization header.
 * If the token is valid, it decodes it and attaches the user's data
 * (including their UID) to the request object as `req.user`.
 * If the token is invalid or missing, it sends an error response.
 */
const verifyFirebaseToken = async (req, res, next) => {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check if the header exists and is correctly formatted
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided or malformed header.' });
    }

    // 3. Extract the token from the 'Bearer <token>' string
    const idToken = authHeader.split('Bearer ')[1];

    try {
        // 4. Use the Firebase Admin SDK to verify the token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // 5. If verification is successful, attach the decoded token to the request object
        req.user = decodedToken;

        // 6. Call `next()` to pass control to the next middleware or the route handler
        next();

    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token.' });
    }
};

module.exports = {
    verifyFirebaseToken,
};