const axios = require('axios');

const ROCKETCHAT_URL = 'http://localhost:3000';

// Function to create a user via API
async function createUser(username, password, email, name) {
  try {
    // First, login as admin to get auth token
    const loginResponse = await axios.post(`${ROCKETCHAT_URL}/api/v1/login`, {
      user: 'admin', // Replace with your admin username
      password: 'admin123' // Replace with your admin password
    });

    if (loginResponse.data.status !== 'success') {
      throw new Error('Admin login failed');
    }

    const { authToken, userId } = loginResponse.data.data;

    // Create new user
    const userResponse = await axios.post(`${ROCKETCHAT_URL}/api/v1/users.create`, {
      username,
      password,
      email,
      name,
      verified: true
    }, {
      headers: {
        'X-Auth-Token': authToken,
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });

    console.log('User created successfully:', userResponse.data);
    return userResponse.data;

  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    console.log('Creating test user...');
    await createUser('testuser', 'testpass123', 'test@example.com', 'Test User');
    console.log('User created successfully!');
  } catch (error) {
    console.error('Failed to create user:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createUser };

