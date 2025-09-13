#!/usr/bin/env node

// Test script to verify Railway deployment readiness
const http = require('http');

console.log('🧪 Testing Railway deployment readiness...\n');

// Test 1: Check if server starts with Railway environment
console.log('1. Testing server startup with Railway environment...');
process.env.RAILWAY_ENVIRONMENT = 'production';
process.env.PORT = '3000';

const server = require('./server.js');

// Wait a bit for server to start
setTimeout(() => {
  console.log('2. Testing health check endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const healthData = JSON.parse(data);
        console.log('✅ Health check response:', healthData);
        
        if (healthData.status === 'healthy') {
          console.log('✅ Railway deployment test PASSED!');
          console.log('🚀 Your app is ready for Railway deployment!');
        } else {
          console.log('❌ Health check failed - status not healthy');
        }
      } catch (error) {
        console.log('❌ Failed to parse health check response:', error);
      }
      
      // Clean up
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.log('❌ Health check request failed:', error);
    process.exit(1);
  });

  req.end();
}, 2000);
