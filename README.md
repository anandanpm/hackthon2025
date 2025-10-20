# 🚀 React Chat App with Rocket.Chat

A feature-rich, modern React chat application that connects to Rocket.Chat. Built for the ReactJS Hackathon 2025, featuring real-time messaging, threads, analytics, search, and more.

![React](https://img.shields.io/badge/React-19.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF.svg)
![Rocket.Chat](https://img.shields.io/badge/Rocket.Chat-7.7.9-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🔐 Authentication & User Management
- **Login/Signup**: Secure authentication with Rocket.Chat backend
- **User Registration**: Create new accounts directly from the app
- **Session Management**: Persistent authentication with token storage

### 💬 Core Chat Features
- **Real-time Messaging**: Instant message delivery and updates
- **Multiple Room Types**: Support for channels, groups, and direct messages
- **Message Actions**: Reply, edit, delete, and react to messages
- **File Sharing**: Send and receive files in conversations
- **Emoji Support**: Express yourself with emojis and reactions

### 🧵 Advanced Chat Features
- **Threaded Conversations**: Organize discussions with message threads
- **Pinned Messages**: Pin important messages for quick access
- **Message Search**: Powerful search across all your conversations
- **Command Palette**: Quick navigation and actions with keyboard shortcuts

### 📊 Analytics & Insights
- **Global Insights**: Overall statistics across all accessible rooms
  - Message counts and activity patterns
  - Top contributors analysis
  - Peak usage hours
  - Channel activity breakdown
- **Channel-Specific Insights**: Detailed analytics for individual channels
  - User participation metrics
  - Message type distribution
  - Daily activity timeline
- **Search Analytics**: Insights from search results

### 👥 Team & Collaboration
- **Team View**: See all team members and their status
- **Channel Creation**: Create new channels and groups
- **Room Management**: Browse and organize your channels
- **User Profiles**: View user information and activity

### 🎨 UI/UX Features
- **Modern Design**: Clean, intuitive interface with Rocket.Chat Fuselage components
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Dark Mode Ready**: Beautiful UI that works in any lighting
- **Smooth Animations**: Polished transitions and interactions

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** (for Rocket.Chat server)
- **Node.js** 20.19+ or 22.12+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/anandanpm/reactjs-hackathon-2025.git
cd reactjs-hackathon-2025
```

### 2. Get Rocket.Chat Registration Token

1. Sign up at [Rocket.Chat Cloud](https://cloud.rocket.chat/home)
2. Click on **Register Self Managed**
3. Copy the registration token

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your registration token
# REG_TOKEN=your_token_here
```

### 4. Start Rocket.Chat Server

```bash
# Start MongoDB and Rocket.Chat using Docker
docker-compose up -d

# Wait for services to be ready (about 1-2 minutes)
# Check status with: docker-compose logs -f rocketchat
```

Access Rocket.Chat admin panel at `http://localhost:3000` to complete setup.

### 5. Start the React App

```bash
cd chat-app
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
reactjs-hackathon-2025/
├── chat-app/                      # React application
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── ChatLayout.jsx    # Main chat container with tabs
│   │   │   ├── Login.jsx         # Login form
│   │   │   ├── Signup.jsx        # User registration
│   │   │   ├── RoomList.jsx      # Channel/room sidebar
│   │   │   ├── MessageList.jsx   # Message display area
│   │   │   ├── MessageInput.jsx  # Message composer
│   │   │   ├── Message.jsx       # Individual message component
│   │   │   ├── ThreadModal.jsx   # Thread conversation view
│   │   │   ├── ThreadsView.jsx   # All threads overview
│   │   │   ├── PinsDashboard.jsx # Pinned messages view
│   │   │   ├── SearchView.jsx    # Search interface
│   │   │   ├── Insights.jsx      # Analytics dashboard
│   │   │   ├── TeamView.jsx      # Team members view
│   │   │   ├── CreateChannel.jsx # Channel creation
│   │   │   ├── CommandPalette.jsx# Quick actions
│   │   │   └── VideoCallButton.jsx# Video call integration
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Authentication state
│   │   ├── services/
│   │   │   └── rocketchat.js     # Rocket.Chat API client
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── package.json              # Dependencies
│   └── vite.config.js            # Vite configuration
├── docker-compose.yml            # Rocket.Chat + MongoDB setup
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## ⚙️ Configuration

### Environment Variables

The React app uses these environment variables (in `chat-app/.env`):

```env
VITE_ROCKETCHAT_URL=http://localhost:3000
```

### Docker Compose Configuration

The `docker-compose.yml` file sets up:
- **MongoDB 8.0**: Database with replica set
- **Rocket.Chat 7.7.9**: Chat server
- **Persistent volumes**: Data persistence across restarts

## 🔧 Troubleshooting

### Common Issues

1. **Rocket.Chat not starting**:
   ```bash
   # Check logs
   docker logs rocketchat
   
   # Restart services
   docker-compose down && docker-compose up -d
   ```

2. **CORS errors in React app**:
   - Make sure CORS is enabled in Rocket.Chat admin settings
   - Go to `http://localhost:3000/admin/settings/General` → **REST API** → **CORS** → Enable and set to `*`

3. **Login failed**:
   - Verify Rocket.Chat is running: `curl http://localhost:3000`
   - Check if user exists in Rocket.Chat admin panel
   - Ensure CORS is properly configured

4. **No rooms/channels**:
   - Make sure you're logged in with a user that has access to channels
   - Check if the user is added to channels in Rocket.Chat admin panel

5. **Messages not loading**:
   - Check browser console for API errors
   - Verify authentication token is valid
   - Ensure you've selected a room/channel

### Development

- **Hot Reload**: The React app supports hot module replacement
- **API Errors**: Check browser console for detailed error messages
- **Rocket.Chat Logs**: Use `docker logs rocketchat -f` to follow logs

## 🚀 Deployment

### Production Setup

1. **Update Environment Variables**:
   ```env
   VITE_ROCKETCHAT_URL=https://your-rocketchat-domain.com
   ```

2. **Build React App**:
   ```bash
   cd chat-app
   npm run build
   ```

3. **Deploy**: Serve the `dist` folder with any static file server

### Docker Production

For production, consider:
- Using environment-specific Docker Compose files
- Setting up proper SSL certificates
- Configuring proper CORS origins instead of `*`
- Using a reverse proxy (nginx)

## 📚 API Integration

The app uses Rocket.Chat's REST API v1:

- **Authentication**: `POST /api/v1/login`
- **Get Rooms**: `GET /api/v1/rooms.get`
- **Get Messages**: `GET /api/v1/channels.history`
- **Send Message**: `POST /api/v1/chat.sendMessage`

## 🛠️ Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Axios**: HTTP client for API calls
- **CSS3**: Modern styling with flexbox/grid
- **Rocket.Chat 7.7.9**: Backend chat server
- **MongoDB 8.0**: Database
- **Docker**: Containerization

## 📝 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Rocket.Chat logs: `docker logs rocketchat`
3. Check browser console for errors
4. Ensure all prerequisites are met

---

**Happy Chatting! 🎉**

