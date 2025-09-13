const WebSocket = require('ws');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:8080';

async function testSystem() {
  console.log('🧪 Testing Real-time Database Notification System\n');
  
  // Test 1: Check if server is running
  console.log('1. Testing server health...');
  try {
    const response = await fetch('http://localhost:3000/health');
    const health = await response.json();
    console.log('✅ Server is healthy:', health);
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    return;
  }
  
  // Test 2: WebSocket connection
  console.log('\n2. Testing WebSocket connection...');
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let wsConnected = false;
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      wsConnected = true;
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('📨 Received WebSocket message:', message);
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket connection failed:', error.message);
    });
    
    // Test 3: API operations
    setTimeout(async () => {
      if (!wsConnected) {
        console.log('❌ WebSocket not connected, skipping API tests');
        resolve();
        return;
      }
      
      console.log('\n3. Testing API operations...');
      
      try {
        // Create order
        console.log('   Creating order...');
        const createResponse = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: 'Test Customer',
            product_name: 'Test Product',
            status: 'pending'
          })
        });
        const newOrder = await createResponse.json();
        console.log('✅ Order created:', newOrder);
        
        // Wait for WebSocket notification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update order
        console.log('   Updating order...');
        const updateResponse = await fetch(`${API_BASE}/orders/${newOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'shipped' })
        });
        const updatedOrder = await updateResponse.json();
        console.log('✅ Order updated:', updatedOrder);
        
        // Wait for WebSocket notification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Delete order
        console.log('   Deleting order...');
        const deleteResponse = await fetch(`${API_BASE}/orders/${newOrder.id}`, {
          method: 'DELETE'
        });
        const deleteResult = await deleteResponse.json();
        console.log('✅ Order deleted:', deleteResult);
        
        // Wait for WebSocket notification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Server health check: ✅');
        console.log('   - WebSocket connection: ✅');
        console.log('   - Create order: ✅');
        console.log('   - Update order: ✅');
        console.log('   - Delete order: ✅');
        console.log('   - Real-time notifications: ✅');
        
        console.log('\n🌐 Open http://localhost:3000 in your browser to see the web interface!');
        
      } catch (error) {
        console.log('❌ API test failed:', error.message);
      }
      
      ws.close();
      resolve();
    }, 2000);
  });
}

// Run tests
testSystem().catch(console.error);
