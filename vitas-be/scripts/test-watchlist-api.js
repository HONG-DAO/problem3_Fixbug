const axios = require('axios');

const BASE_URL = 'http://localhost:3333/api';

async function testWatchlistAPI() {
  console.log('🧪 Testing Watchlist API Endpoints...\n');

  try {
    // Test 1: Create Watchlist
    console.log('1️⃣ Testing POST /dashboard/watchlist/create');
    const createResponse = await axios.post(`${BASE_URL}/dashboard/watchlist/create`, {
      name: 'Test Watchlist',
      tickers: ['VCB', 'VIC', 'FPT'],
      notificationChannels: ['telegram', 'dashboard'],
      preferences: {
        minConfidence: 0.7,
        signalTypes: ['buy', 'sell'],
        timeframes: ['1h', '1d']
      }
    });
    
    console.log('✅ Create Watchlist Response:', createResponse.data);
    console.log('');

    // Test 2: Get Watchlist
    console.log('2️⃣ Testing GET /dashboard/watchlist');
    const getResponse = await axios.get(`${BASE_URL}/dashboard/watchlist`);
    
    console.log('✅ Get Watchlist Response:', getResponse.data);
    console.log('');

    // Test 3: Add Ticker to Watchlist
    console.log('3️⃣ Testing POST /dashboard/watchlist');
    const addResponse = await axios.post(`${BASE_URL}/dashboard/watchlist`, {
      ticker: 'ACB',
      notificationChannels: ['telegram'],
      preferences: {
        minConfidence: 0.8,
        signalTypes: ['buy'],
        timeframes: ['1d']
      }
    });
    
    console.log('✅ Add Ticker Response:', addResponse.data);
    console.log('');

    // Test 4: Get Watchlist Again
    console.log('4️⃣ Testing GET /dashboard/watchlist (after adding ACB)');
    const getResponse2 = await axios.get(`${BASE_URL}/dashboard/watchlist`);
    
    console.log('✅ Get Watchlist Response (updated):', getResponse2.data);
    console.log('');

    // Test 5: Update Preferences
    console.log('5️⃣ Testing POST /dashboard/watchlist/preferences');
    const updateResponse = await axios.post(`${BASE_URL}/dashboard/watchlist/preferences`, {
      ticker: 'VCB',
      preferences: {
        minConfidence: 0.9,
        signalTypes: ['buy', 'sell', 'risk_warning'],
        timeframes: ['1h', '1d', '4h']
      }
    });
    
    console.log('✅ Update Preferences Response:', updateResponse.data);
    console.log('');

    // Test 6: Get Watchlist Statistics
    console.log('6️⃣ Testing GET /dashboard/watchlist-stats');
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/watchlist-stats`);
    
    console.log('✅ Watchlist Statistics Response:', statsResponse.data);
    console.log('');

    // Test 7: Remove Ticker from Watchlist
    console.log('7️⃣ Testing POST /dashboard/watchlist/remove');
    const removeResponse = await axios.post(`${BASE_URL}/dashboard/watchlist/remove`, {
      ticker: 'ACB'
    });
    
    console.log('✅ Remove Ticker Response:', removeResponse.data);
    console.log('');

    // Test 8: Get Final Watchlist
    console.log('8️⃣ Testing GET /dashboard/watchlist (final)');
    const finalResponse = await axios.get(`${BASE_URL}/dashboard/watchlist`);
    
    console.log('✅ Final Watchlist Response:', finalResponse.data);
    console.log('');

    console.log('🎉 All Watchlist API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the backend server is running on port 3333');
      console.log('   Run: cd /home/phuocdai/VITAS/vitas-be && npm run start:dev');
    }
  }
}

// Run the test
testWatchlistAPI();
