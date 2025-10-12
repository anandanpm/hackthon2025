# Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the React Chat App with Rocket.Chat.

## 🚨 Common Issues

### 1. Rocket.Chat Won't Start

**Symptoms:**
- `docker-compose up` fails
- Rocket.Chat container keeps restarting
- Connection refused on localhost:3000

**Solutions:**

```bash
# Check container status
docker ps -a

# View Rocket.Chat logs
docker logs rocketchat

# Check MongoDB logs
docker logs mongo

# Restart everything
docker-compose down
docker-compose up -d

# Reinitialize MongoDB replica set
docker exec mongo mongosh --eval "rs.initiate()"
```

**Common Causes:**
- MongoDB replica set not initialized
- Port 3000 already in use
- Insufficient system resources

### 2. CORS Errors in React App

**Symptoms:**
- "Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy"
- Login fails with network error

**Solutions:**

1. **Enable CORS in Rocket.Chat:**
   - Go to `http://localhost:3000/admin/settings/General`
   - Navigate to **REST API** section
   - Find **CORS** setting
   - Enable CORS and set to `*`
   - Save settings

2. **Verify Rocket.Chat is accessible:**
   ```bash
   curl http://localhost:3000
   ```

### 3. Login Failures

**Symptoms:**
- "Login failed" error
- "Invalid credentials" message
- User not found errors

**Solutions:**

1. **Verify user exists in Rocket.Chat:**
   - Go to `http://localhost:3000`
   - Login as admin
   - Go to Administration → Users
   - Check if your user exists

2. **Create a test user:**
   - In Rocket.Chat admin panel
   - Go to Administration → Users
   - Click "+ New"
   - Fill in user details
   - Save

3. **Check user permissions:**
   - Ensure user has access to channels
   - Add user to #general channel

### 4. No Rooms/Channels Available

**Symptoms:**
- Empty room list in React app
- "No rooms available" message

**Solutions:**

1. **Add user to channels:**
   - Go to Rocket.Chat admin panel
   - Navigate to Administration → Rooms
   - Find #general channel
   - Click on it → Members tab
   - Add your user

2. **Create a new channel:**
   - In Rocket.Chat, click "+" next to channels
   - Create a new channel
   - Add users to the channel

### 5. Messages Not Loading

**Symptoms:**
- Empty message area
- "Failed to load messages" error
- Messages not updating

**Solutions:**

1. **Check authentication:**
   - Verify you're logged in
   - Check browser console for auth errors

2. **Select a room:**
   - Make sure you've selected a room from the sidebar
   - Try selecting different rooms

3. **Check network:**
   - Open browser dev tools
   - Look for failed API requests
   - Check if Rocket.Chat is responding

### 6. React App Won't Start

**Symptoms:**
- `npm run dev` fails
- Port already in use errors
- Module not found errors

**Solutions:**

```bash
# Install dependencies
cd chat-app
npm install

# Clear npm cache
npm cache clean --force

# Try different port
npm run dev -- --port 5174

# Check Node.js version
node --version
# Should be 20.19+ or 22.12+
```

### 7. Docker Issues

**Symptoms:**
- Docker commands fail
- Containers won't start
- Permission denied errors

**Solutions:**

```bash
# Check Docker status
docker info

# Restart Docker service
sudo systemctl restart docker  # Linux
# or restart Docker Desktop on Mac/Windows

# Clean up containers
docker-compose down
docker system prune -f

# Rebuild containers
docker-compose up -d --build
```

## 🔍 Debugging Steps

### 1. Check System Status

```bash
# Check if services are running
docker ps

# Check Rocket.Chat logs
docker logs rocketchat --tail 50

# Check MongoDB logs
docker logs mongo --tail 50

# Test Rocket.Chat connectivity
curl -v http://localhost:3000
```

### 2. Browser Debugging

1. **Open Developer Tools** (F12)
2. **Check Console** for JavaScript errors
3. **Check Network** tab for failed requests
4. **Check Application** tab for localStorage/auth tokens

### 3. API Testing

```bash
# Test Rocket.Chat API
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"your-username","password":"your-password"}'
```

## 📋 System Requirements

### Minimum Requirements
- **RAM**: 4GB (8GB recommended)
- **CPU**: 2 cores
- **Disk**: 10GB free space
- **Docker**: 20.10+
- **Node.js**: 20.19+ or 22.12+

### Platform-Specific Issues

#### macOS (Apple Silicon)
- Use `--platform linux/amd64` for Docker images
- May need to increase Docker memory limit

#### Windows
- Ensure WSL2 is enabled
- Check Windows Defender firewall settings
- Use Docker Desktop for Windows

#### Linux
- Ensure user is in docker group
- Check firewall settings
- Verify systemd service status

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Review the logs** (Docker and browser console)
3. **Verify system requirements**
4. **Try the solutions above**

### Information to Include

When asking for help, include:
- Operating system and version
- Docker version (`docker --version`)
- Node.js version (`node --version`)
- Error messages (full text)
- Steps to reproduce the issue
- Logs from `docker logs rocketchat`

### Useful Commands

```bash
# System information
docker --version
node --version
npm --version

# Container status
docker-compose ps

# Resource usage
docker stats

# Clean up
docker-compose down
docker system prune -f
```

## 🔧 Advanced Troubleshooting

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v
docker system prune -f

# Remove volumes (WARNING: This deletes all data)
docker volume prune -f

# Start fresh
docker-compose up -d
```

### Custom Configuration

If you need to modify the setup:

1. **Edit docker-compose.yml** for different ports/versions
2. **Edit chat-app/.env** for different Rocket.Chat URL
3. **Modify src/services/rocketchat.js** for API changes

### Performance Issues

- **Increase Docker memory** (8GB+ recommended)
- **Use SSD storage** for better I/O performance
- **Close unnecessary applications**
- **Monitor resource usage** with `docker stats`

---

**Still having issues?** Check the main README.md for additional information or create an issue in the repository.
