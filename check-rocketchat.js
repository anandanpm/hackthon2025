const axios = require('axios');

const ROCKETCHAT_URL = 'http://localhost:3000';

async function checkRocketChat() {
  try {
    console.log('Checking Rocket.Chat status...');
    
    // Try to access the main page
    const response = await axios.get(ROCKETCHAT_URL, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log('✅ Rocket.Chat is running and accessible!');
      console.log('🌐 Access it at: http://localhost:3000');
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Rocket.Chat is not ready yet. Still starting up...');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏳ Rocket.Chat is starting up (timeout). Please wait...');
    } else {
      console.log('❌ Error checking Rocket.Chat:', error.message);
    }
    return false;
  }
}

// Check every 10 seconds
async function waitForRocketChat() {
  console.log('Waiting for Rocket.Chat to start...');
  
  while (true) {
    const isReady = await checkRocketChat();
    if (isReady) {
      console.log('\n🎉 Rocket.Chat is ready! You can now:');
      console.log('1. Go to http://localhost:3000');
      console.log('2. Complete the setup wizard');
      console.log('3. Create your admin account');
      console.log('4. Create additional users through the admin panel');
      break;
    }
    
    console.log('Waiting 10 seconds before checking again...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

// Run the check
waitForRocketChat();

