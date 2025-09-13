const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Railway requires SSL
  }
});

async function testConnection() {
  console.log('🔌 Testing Railway PostgreSQL connection...');
  console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Railway PostgreSQL!');
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Test if we can create tables
    const testResult = await client.query('SELECT current_database(), current_user');
    console.log('📋 Current database:', testResult.rows[0].current_database);
    console.log('👤 Current user:', testResult.rows[0].current_user);
    
    client.release();
    await pool.end();
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
