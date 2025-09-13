# Real-time Database Change Notification System

A comprehensive Node.js application that demonstrates real-time database change notifications using PostgreSQL triggers, WebSockets, and a modern web interface.

## 🚀 Features

- **Real-time Updates**: Clients automatically receive notifications when database changes occur
- **No Polling**: Uses PostgreSQL LISTEN/NOTIFY for efficient change detection
- **WebSocket Communication**: Fast, bidirectional communication between server and clients
- **RESTful API**: Complete CRUD operations for order management
- **Modern Web Interface**: Beautiful, responsive UI with real-time notifications
- **Scalable Architecture**: Designed to handle multiple concurrent clients
- **Railway Ready**: Optimized for deployment on Railway platform

## 🏗️ Architecture

### System Components

1. **PostgreSQL Database**
   - `orders` table with triggers for INSERT/UPDATE/DELETE operations
   - Custom function to send notifications via `pg_notify`
   - LISTEN/NOTIFY mechanism for real-time change detection

2. **Node.js Backend**
   - Express.js REST API server (Port 3000)
   - WebSocket server (Port 8080)
   - PostgreSQL connection pool
   - Database change listener

3. **Web Client**
   - Modern HTML5/CSS3/JavaScript interface
   - WebSocket client for real-time updates
   - AJAX calls for CRUD operations
   - Real-time notification display

### Data Flow

```
Database Change → PostgreSQL Trigger → pg_notify → Node.js Listener → WebSocket → Client
```

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Railway Deployment

This project is optimized for deployment on Railway. Follow these steps to deploy:

### 1. Prepare Your Repository

1. Push your code to GitHub
2. Ensure all files are committed (including `railway.json` and updated `Dockerfile`)

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect your Dockerfile and deploy

### 3. Add PostgreSQL Database

1. In your Railway project dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. The database credentials will be available as environment variables

### 4. Configure Environment Variables

Railway will automatically set these environment variables:
- `DATABASE_URL` - Complete PostgreSQL connection string
- `PORT` - Port for your application (Railway assigns this)
- `RAILWAY_ENVIRONMENT` - Set to "production"

### 5. Deploy and Test

1. Railway will automatically build and deploy your application
2. Once deployed, you'll get a public URL (e.g., `https://your-app.railway.app`)
3. Test the deployment:
   - Visit your Railway URL
   - Check the health endpoint: `https://your-app.railway.app/health`
   - Test WebSocket connection and real-time features

### Railway-Specific Features

- **Automatic HTTPS**: Railway provides SSL certificates automatically
- **WebSocket Support**: WebSockets work seamlessly on Railway
- **Database Integration**: PostgreSQL database is automatically connected
- **Environment Variables**: Secure environment variable management
- **Custom Domains**: Add your own domain in Railway settings
- **Scaling**: Easy horizontal scaling in Railway dashboard

### Railway Deployment Benefits

✅ **Zero Configuration**: Works out of the box  
✅ **Automatic SSL**: HTTPS enabled by default  
✅ **Database Included**: PostgreSQL database provisioned automatically  
✅ **WebSocket Support**: Real-time features work perfectly  
✅ **Custom Domains**: Add your own domain easily  
✅ **Monitoring**: Built-in logs and metrics  
✅ **Scaling**: Scale up/down with one click  

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd realtime-db-notifications
npm install
```

### 2. Database Setup

#### Option A: Railway PostgreSQL (Currently Configured)

The project is already configured to use Railway PostgreSQL with the following credentials:
- **Host**: hopper.proxy.rlwy.net
- **Port**: 32273
- **Database**: railway
- **User**: postgres

The database schema and triggers are already set up. Simply run:
```bash
npm run setup-db
```

#### Option B: Using Docker

```bash
# Start PostgreSQL container
docker run --name postgres-realtime \
  -e POSTGRES_DB=realtime_orders \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:13

# Wait for container to start, then setup database
npm run setup-db
```

#### Option C: Local PostgreSQL Installation

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE realtime_orders;
   ```
3. Update environment variables in `env.example` and rename to `.env`
4. Run the setup script:
   ```bash
   npm run setup-db
   ```

### 3. Environment Configuration

The project is already configured with Railway PostgreSQL credentials. The `.env` file contains:

```env
# Database Configuration - Railway PostgreSQL
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=32273
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=uyhTnQlyQOEYtLwhNdQlvlMUSCYNjJXK

# Server Configuration
PORT=3000
WS_PORT=8080
```

**Note**: The Railway PostgreSQL connection includes SSL support and is already configured in the codebase.

### 4. Start the Application

#### Option A: With Railway PostgreSQL (Currently Running)
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

#### Option B: Mock Version (No Database Required)
```bash
# Development mode (with auto-restart)
npm run dev:mock

# Production mode
npm run start:mock
```

The application will start:
- REST API server on `http://localhost:3000`
- WebSocket server on `ws://localhost:8080`
- Web interface on `http://localhost:3000`

**Current Status**: The system is running with Railway PostgreSQL and real-time database triggers are active!

## 🎯 Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. The interface shows:
   - **Connection Status**: WebSocket connection indicator
   - **Create Order Form**: Add new orders
   - **Update/Delete Form**: Modify existing orders
   - **Orders Table**: Current orders with real-time updates
   - **Notifications Panel**: Real-time change notifications

### API Endpoints

#### REST API (Port 3000)

- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /health` - Health check

#### WebSocket (Port 8080)

Connect to `ws://localhost:8080` to receive real-time notifications:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Order change:', data);
};
```

### Example API Usage

#### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "product_name": "Laptop",
    "status": "pending"
  }'
```

#### Update Order
```bash
curl -X PUT http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

#### Delete Order
```bash
curl -X DELETE http://localhost:3000/api/orders/1
```

## 🔧 Technical Implementation

### Database Triggers

The system uses PostgreSQL triggers to automatically detect changes:

```sql
-- Function to notify changes
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

-- Trigger for all operations
CREATE TRIGGER order_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_changes();
```

### WebSocket Implementation

The server maintains a set of connected clients and broadcasts changes:

```javascript
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcastToClients(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
```

### Database Listener

The server listens for PostgreSQL notifications:

```javascript
async function setupDatabaseListener() {
  const client = await pool.connect();
  await client.query('LISTEN order_changes');
  
  client.on('notification', (msg) => {
    const changeData = JSON.parse(msg.payload);
    broadcastToClients({
      type: 'order_change',
      data: changeData,
      timestamp: new Date().toISOString()
    });
  });
}
```

## 🎨 Design Decisions

### Why PostgreSQL LISTEN/NOTIFY?

1. **Efficiency**: No polling required - changes are pushed immediately
2. **Reliability**: Built into PostgreSQL, no external dependencies
3. **Performance**: Minimal overhead compared to polling solutions
4. **Scalability**: Can handle many concurrent listeners

### Why WebSockets?

1. **Real-time**: Bidirectional, low-latency communication
2. **Efficiency**: Persistent connection, no HTTP overhead
3. **Browser Support**: Native WebSocket API in all modern browsers
4. **Scalability**: Can handle thousands of concurrent connections

### Why This Architecture?

1. **Separation of Concerns**: Database, API, and WebSocket servers are separate
2. **Scalability**: Each component can be scaled independently
3. **Maintainability**: Clear separation makes debugging easier
4. **Flexibility**: Easy to add new features or change components

## 🚀 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use nginx or similar to distribute WebSocket connections
2. **Database Clustering**: PostgreSQL streaming replication
3. **Redis Pub/Sub**: For multi-server WebSocket broadcasting
4. **Container Orchestration**: Docker Swarm or Kubernetes

### Performance Optimizations

1. **Connection Pooling**: Already implemented with pg.Pool
2. **WebSocket Compression**: Enable per-message deflate
3. **Database Indexing**: Add indexes on frequently queried columns
4. **Caching**: Redis for frequently accessed data

## 🧪 Testing

### Quick Start (Mock Version)

```bash
# Start the mock server
npm run start:mock

# In another terminal, run the test suite
npm test

# Or test the CLI client
npm run cli
```

### Manual Testing

1. Start the server: `npm run start:mock`
2. Open multiple browser tabs to `http://localhost:3000`
3. Create, update, or delete orders in one tab
4. Watch real-time updates appear in other tabs

### Automated Testing

The project includes a comprehensive test suite:

```bash
# Run the full test suite
npm test
```

This will test:
- Server health check
- WebSocket connection
- CRUD operations (Create, Read, Update, Delete)
- Real-time notifications
- End-to-end functionality

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **WebSocket Connection Failed**
   - Check if port 8080 is available
   - Verify firewall settings
   - Check browser console for errors

3. **No Real-time Updates**
   - Verify database triggers are installed
   - Check server logs for errors
   - Ensure WebSocket connection is established

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=* npm start
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connectedClients": 5
}
```

### Logs

The application logs:
- WebSocket connections/disconnections
- Database change notifications
- API requests
- Errors and warnings

## 🔒 Security Considerations

### Production Deployment

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS/WSS**: Use secure connections in production
3. **Authentication**: Add JWT or session-based auth
4. **Rate Limiting**: Implement API rate limiting
5. **Input Validation**: Sanitize all user inputs
6. **CORS**: Configure appropriate CORS policies

### Database Security

1. **Connection Encryption**: Use SSL for database connections
2. **User Permissions**: Create dedicated database user with minimal privileges
3. **Network Security**: Restrict database access to application servers

## 📚 Further Reading

- [PostgreSQL LISTEN/NOTIFY Documentation](https://www.postgresql.org/docs/current/sql-notify.html)
- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js WebSocket Library](https://github.com/websockets/ws)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- PostgreSQL team for the excellent LISTEN/NOTIFY feature
- WebSocket community for the robust protocol
- Node.js ecosystem for the rich package ecosystem
