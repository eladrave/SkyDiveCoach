# SkyMentor Docker Setup

This document provides instructions for running SkyMentor using Docker Compose with full Hot Module Replacement (HMR) support.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.x or higher
- At least 4GB of available RAM for Docker
- Ports 5000, 5173, and 5432 available on your host machine

## Quick Start

1. **Start all services:**
   ```bash
   npm run docker:up
   ```
   This command will:
   - Build all Docker images
   - Start PostgreSQL database
   - Run database migrations automatically
   - Start the backend API server with hot reload
   - Start the frontend Vite dev server with HMR

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001 (mapped from internal port 5000)
   - PostgreSQL: localhost:5433 (mapped from internal port 5432, user: skymentor, password: skymentor123)

3. **View logs:**
   ```bash
   npm run docker:logs
   ```

## Docker Commands

### Basic Operations
- `npm run docker:up` - Start all services with build
- `npm run docker:down` - Stop all services
- `npm run docker:restart` - Restart all services
- `npm run docker:logs` - View logs from all containers
- `npm run docker:build` - Build/rebuild Docker images

### Database Operations
- `npm run docker:db:push` - Run database migrations
- `npm run docker:db:seed` - Seed the database with test data
- `npm run docker:clean` - Remove all containers and volumes (⚠️ Deletes all data)

## Architecture

The Docker setup consists of three services:

### 1. Database (db)
- PostgreSQL 15 Alpine
- Persistent volume for data storage
- Automatic UUID extension installation
- Health checks for service readiness

### 2. Backend (backend)
- Node.js 20 Alpine
- Express.js API server
- TSX watch mode for hot reload
- Automatic database migration on startup
- Volume mounts for source code changes

### 3. Frontend (frontend)
- Node.js 20 Alpine
- Vite dev server with React
- Full HMR support for instant updates
- Proxy configuration for API calls
- Volume mounts for source code changes

## Hot Module Replacement (HMR)

HMR is fully configured and should work automatically:

1. **Frontend Changes**: Edit any file in `/client` and see changes instantly in the browser
2. **Backend Changes**: Edit any file in `/server` and the API server will restart automatically
3. **Shared Changes**: Changes to `/shared` will trigger both frontend and backend updates

## Default Test Accounts

After running `npm run docker:db:seed`, you can login with:

- **Mentor**: mentor@test.com / password123
- **Mentee**: mentee@test.com / password123
- **Admin**: admin@test.com / password123

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
```bash
# Check what's using the ports
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # Database
```

### Database Connection Issues
If the backend can't connect to the database:
1. Ensure the database container is healthy: `docker-compose ps`
2. Check database logs: `docker-compose logs db`
3. Try restarting: `npm run docker:restart`

### HMR Not Working
If hot reload isn't working:
1. Check that `CHOKIDAR_USEPOLLING=true` is set in docker-compose.yml
2. Ensure volume mounts are configured correctly
3. Try restarting the frontend container: `docker-compose restart frontend`

### Clean Start
For a completely fresh start:
```bash
npm run docker:clean  # ⚠️ This deletes all data
npm run docker:up
npm run docker:db:seed  # Optional: add test data
```

## Development Workflow

1. **Start the environment:**
   ```bash
   npm run docker:up
   ```

2. **Make your changes:**
   - Frontend code in `/client/src`
   - Backend code in `/server`
   - Shared types in `/shared`

3. **Changes are automatically reflected:**
   - Frontend: Instant HMR updates
   - Backend: Auto-restart with tsx watch

4. **Run database migrations if needed:**
   ```bash
   npm run docker:db:push
   ```

5. **Stop when done:**
   ```bash
   npm run docker:down
   ```

## Environment Variables

The Docker setup uses environment variables defined in:
- `.env` - Main configuration file
- `docker-compose.yml` - Docker-specific overrides

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT session secret
- `NODE_ENV` - Set to "development" for dev features
- `VITE_API_URL` - API URL for frontend proxy

## Network Configuration

All services communicate through a Docker bridge network:
- Services can reach each other by service name (db, backend, frontend)
- The backend connects to database using `db:5432`
- The frontend proxies API calls to `backend:5000`
- Ports are exposed to host for external access

## Volume Mounts

The setup uses both named volumes and bind mounts:
- **Named Volumes**: 
  - `postgres_data` - Database persistence
  - `*_node_modules` - Container-specific dependencies
- **Bind Mounts**: Source code for hot reload

## Security Notes

⚠️ The current setup is for **development only**:
- Default passwords are used
- Ports are exposed to all interfaces
- Debug mode is enabled
- CORS is permissive

For production, ensure you:
- Use strong, unique passwords
- Implement proper CORS policies
- Use HTTPS/TLS
- Restrict port exposure
- Disable debug features
