const express = require('express');
const WebSocket = require('ws');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
// For Railway, use the same port for WebSocket (they handle routing)
const WS_PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'realtime_orders',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: {
    rejectUnauthorized: false 
  }
});

// WebSocket server setup
let wss;
let server;

// Store connected clients
const clients = new Set();

// WebSocket event handlers
function setupWebSocketHandlers(wss) {
  wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
}

// Function to broadcast to all connected clients
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Database change listener
async function setupDatabaseListener() {
  const client = await pool.connect();
  
  try {
    // Listen for notifications
    await client.query('LISTEN order_changes');
    console.log('Listening for database changes...');
    
    client.on('notification', (msg) => {
      console.log('Database change detected:', msg.payload);
      try {
        const changeData = JSON.parse(msg.payload);
        broadcastToClients({
          type: 'order_change',
          data: changeData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });
    
    client.on('error', (error) => {
      console.error('Database listener error:', error);
    });
    
  } catch (error) {
    console.error('Error setting up database listener:', error);
  }
}

// REST API Routes

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, product_name, status = 'pending' } = req.body;
    
    if (!customer_name || !product_name) {
      return res.status(400).json({ error: 'customer_name and product_name are required' });
    }
    
    const validStatuses = ['pending', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: pending, shipped, delivered' });
    }
    
    const result = await pool.query(
      'INSERT INTO orders (customer_name, product_name, status) VALUES ($1, $2, $3) RETURNING *',
      [customer_name, product_name, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, product_name, status } = req.body;
    
    const validStatuses = ['pending', 'shipped', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: pending, shipped, delivered' });
    }
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (customer_name) {
      updates.push(`customer_name = $${paramCount++}`);
      values.push(customer_name);
    }
    if (product_name) {
      updates.push(`product_name = $${paramCount++}`);
      values.push(product_name);
    }
    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connectedClients: clients.size 
  });
});

// Start servers
console.log('Starting server...');
console.log('Environment:', process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local');
console.log('Port:', PORT);

if (process.env.RAILWAY_ENVIRONMENT) {
  // Railway: Start combined HTTP/WebSocket server
  server = require('http').createServer(app);
  wss = new WebSocket.Server({ server });
  setupWebSocketHandlers(wss);
  
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} (Railway)`);
    console.log(`✅ Health check available at: http://localhost:${PORT}/health`);
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });
} else {
  // Local development: Start separate servers
  app.listen(PORT, () => {
    console.log(`✅ REST API server running on port ${PORT}`);
  });

  wss = new WebSocket.Server({ port: WS_PORT });
  setupWebSocketHandlers(wss);
  wss.on('listening', () => {
    console.log(`✅ WebSocket server running on port ${WS_PORT}`);
  });
  
  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
  });
}

// Setup database listener
console.log('Setting up database listener...');
setupDatabaseListener().catch((error) => {
  console.error('❌ Failed to setup database listener:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down servers...');
  wss.close();
  await pool.end();
  process.exit(0);
});
