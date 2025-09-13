const WebSocket = require('ws');
const readline = require('readline');

const WS_URL = 'ws://localhost:8080';

console.log('🚀 Real-time Order Management CLI Client');
console.log('==========================================\n');

// Create WebSocket connection
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('📡 Listening for real-time order updates...\n');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  const { type, data: orderData, timestamp } = message;
  
  if (type === 'order_change') {
    const { operation, id, customer_name, product_name, status } = orderData;
    
    let emoji = '📝';
    let action = 'modified';
    
    switch (operation) {
      case 'INSERT':
        emoji = '🆕';
        action = 'created';
        break;
      case 'UPDATE':
        emoji = '🔄';
        action = 'updated';
        break;
      case 'DELETE':
        emoji = '🗑️';
        action = 'deleted';
        break;
    }
    
    console.log(`${emoji} Order ${action}:`);
    console.log(`   ID: ${id}`);
    console.log(`   Customer: ${customer_name}`);
    console.log(`   Product: ${product_name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Time: ${new Date(timestamp).toLocaleString()}`);
    console.log('   ' + '─'.repeat(50));
  }
});

ws.on('close', () => {
  console.log('\n❌ Disconnected from WebSocket server');
  process.exit(0);
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
  console.log('Make sure the server is running: npm start');
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  ws.close();
});

console.log('Press Ctrl+C to exit\n');
