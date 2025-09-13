const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock database
let orders = [
  { id: 1, customer_name: 'John Doe', product_name: 'Laptop', status: 'pending', updated_at: new Date().toISOString() },
  { id: 2, customer_name: 'Jane Smith', product_name: 'Mouse', status: 'shipped', updated_at: new Date().toISOString() },
  { id: 3, customer_name: 'Bob Johnson', product_name: 'Keyboard', status: 'delivered', updated_at: new Date().toISOString() }
];

let nextId = 4;

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

// Store connected clients
const clients = new Set();

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

// Function to broadcast to all connected clients
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Function to simulate database change notification
function simulateDatabaseChange(operation, orderData) {
  console.log(`Simulating database change: ${operation}`, orderData);
  
  // Simulate the delay that would occur with real database triggers
  setTimeout(() => {
    broadcastToClients({
      type: 'order_change',
      data: {
        operation,
        ...orderData
      },
      timestamp: new Date().toISOString()
    });
  }, 100);
}

// REST API Routes

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = orders.find(o => o.id === parseInt(id));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
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
    
    const newOrder = {
      id: nextId++,
      customer_name,
      product_name,
      status,
      updated_at: new Date().toISOString()
    };
    
    orders.unshift(newOrder);
    
    // Simulate database trigger
    simulateDatabaseChange('INSERT', newOrder);
    
    res.status(201).json(newOrder);
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
    
    const orderIndex = orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const validStatuses = ['pending', 'shipped', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: pending, shipped, delivered' });
    }
    
    const order = orders[orderIndex];
    
    if (customer_name) order.customer_name = customer_name;
    if (product_name) order.product_name = product_name;
    if (status) order.status = status;
    
    order.updated_at = new Date().toISOString();
    
    // Simulate database trigger
    simulateDatabaseChange('UPDATE', order);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === parseInt(id));
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const deletedOrder = orders[orderIndex];
    orders.splice(orderIndex, 1);
    
    // Simulate database trigger
    simulateDatabaseChange('DELETE', deletedOrder);
    
    res.json({ message: 'Order deleted successfully', order: deletedOrder });
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
    connectedClients: clients.size,
    mode: 'mock'
  });
});

// Start servers
app.listen(PORT, () => {
  console.log(`🚀 Mock REST API server running on port ${PORT}`);
  console.log(`📡 This is a demonstration version without PostgreSQL`);
  console.log(`🌐 Open http://localhost:${PORT} to see the web interface`);
});

wss.on('listening', () => {
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
  console.log(`📊 Mock database initialized with ${orders.length} sample orders`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down servers...');
  wss.close();
  process.exit(0);
});
