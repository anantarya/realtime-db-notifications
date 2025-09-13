const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'realtime_orders',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: {
    rejectUnauthorized: false // Required for Railway PostgreSQL
  }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up database...');
    
    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'shipped', 'delivered')),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create function to notify changes
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_order_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          PERFORM pg_notify('order_changes', 
            json_build_object(
              'operation', TG_OP,
              'id', OLD.id,
              'customer_name', OLD.customer_name,
              'product_name', OLD.product_name,
              'status', OLD.status,
              'updated_at', OLD.updated_at
            )::text
          );
          RETURN OLD;
        ELSE
          PERFORM pg_notify('order_changes', 
            json_build_object(
              'operation', TG_OP,
              'id', NEW.id,
              'customer_name', NEW.customer_name,
              'product_name', NEW.product_name,
              'status', NEW.status,
              'updated_at', NEW.updated_at
            )::text
          );
          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create triggers for INSERT, UPDATE, DELETE
    await client.query(`
      DROP TRIGGER IF EXISTS order_changes_trigger ON orders;
      CREATE TRIGGER order_changes_trigger
        AFTER INSERT OR UPDATE OR DELETE ON orders
        FOR EACH ROW EXECUTE FUNCTION notify_order_changes();
    `);
    
    // Insert some sample data
    await client.query(`
      INSERT INTO orders (customer_name, product_name, status) VALUES
      ('John Doe', 'Laptop', 'pending'),
      ('Jane Smith', 'Mouse', 'shipped'),
      ('Bob Johnson', 'Keyboard', 'delivered')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('Database setup completed successfully!');
    console.log('Sample data inserted.');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
