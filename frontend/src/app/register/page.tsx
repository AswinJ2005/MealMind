'use client'; // This directive is essential to use React hooks like useState and useEffect

import { useState } from 'react';
import axios from 'axios';

export default function RegisterPage() {
    // State to hold the form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
    });

    // State for loading and error messages
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Function to handle input changes and update state
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Function to handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Get the API URL from environment variables
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            // ===== THIS IS THE DEBUGGING LINE =====
            // Check your browser's developer console (F12) to see what this prints.
            // It should print "http://localhost:3001/api/v1". If it prints "undefined", your .env.local file is not set up correctly.
            console.log("Attempting to connect to API at:", apiUrl);

            // Make the POST request to the backend registration endpoint
            const response = await axios.post(`${apiUrl}/auth/register`, formData);

            if (response.status === 201) {
                setSuccess('Registration successful! You can now log in.');
                // Clear the form on successful registration
                setFormData({ email: '', password: '', displayName: '' });
            }
        } catch (err: any) {
            console.error('Registration failed:', err);
            // Set a user-friendly error message from the backend's response if possible
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('An unknown error occurred. Please try again.');
            }
        } finally {
            // Stop the loading indicator regardless of success or failure
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-[#1e1e1e] rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">Create Your Account</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="displayName" className="block mb-2 text-sm font-medium">Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            id="displayName"
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your Name"
                            value={formData.displayName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {/* Display success or error messages to the user */}
                {error && <p className="mt-4 text-center text-red-400">{error}</p>}
                {success && <p className="mt-4 text-center text-green-400">{success}</p>}
                
            </div>
        </main>
    );
}