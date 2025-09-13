const { Pool } = require('pg');
require('dotenv').config();

async function quickTest() {
  console.log('🔌 Quick Railway PostgreSQL test...');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL');
    
    // Test if orders table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'orders'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Orders table exists');
      
      // Get sample data
      const orders = await client.query('SELECT * FROM orders LIMIT 3');
      console.log('📊 Sample orders:', orders.rows);
    } else {
      console.log('❌ Orders table does not exist');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();
