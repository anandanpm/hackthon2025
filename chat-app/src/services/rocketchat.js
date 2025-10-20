import axios from 'axios';

const BASE_URL = import.meta.env.VITE_ROCKETCHAT_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});

// Helper function to get auth headers
const getAuthHeaders = (authToken, userId) => ({
  'X-Auth-Token': authToken,
  'X-User-Id': userId,
  'Content-Type': 'application/json',
});

// Authentication
export const login = async (username, password) => {
  try {
    const response = await api.post('/login', {
      user: username,
      password: password,
    });
    
    if (response.data.status === 'success') {
      return {
        success: true,
        authToken: response.data.data.authToken,
        userId: response.data.data.userId,
        user: response.data.data.me,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Login failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Network error during login',
    };
  }
};

// Register/Signup
export const register = async (name, email, username, password) => {
  try {
    const response = await api.post('/users.register', {
      name,
      email,
      username,
      pass: password,
    });
    
    if (response.data.success) {
      return {
        success: true,
        user: response.data.user,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Registration failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || 'Network error during registration',
      details: error.response?.data,
    };
  }
};

// Get user info
export const getUserInfo = async (authToken, userId) => {
  try {
    const response = await api.get('/me', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      user: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user info',
    };
  }
};

// Get rooms/channels
export const getRooms = async (authToken, userId) => {
  try {
    const response = await api.get('/rooms.get', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      rooms: response.data.update || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get rooms',
    };
  }
};

// Get messages for a room
export const getMessages = async (roomId, authToken, userId, count = 50) => {
  try {
    // Try different endpoints based on room type
    // First try channels.history (for public channels)
    let response;
    try {
      response = await api.get(`/channels.history?roomId=${roomId}&count=${count}`, {
        headers: getAuthHeaders(authToken, userId),
      });
    } catch (channelError) {
      // If channels.history fails, try groups.history (for private groups)
      try {
        response = await api.get(`/groups.history?roomId=${roomId}&count=${count}`, {
          headers: getAuthHeaders(authToken, userId),
        });
      } catch (groupError) {
        // If groups.history fails, try im.history (for direct messages)
        response = await api.get(`/im.history?roomId=${roomId}&count=${count}`, {
          headers: getAuthHeaders(authToken, userId),
        });
      }
    }
    
    // Filter out system messages (like pin notifications, user joined/left, etc.)
    const messages = response.data.messages || [];
    const filteredMessages = messages.filter(msg => {
      // Keep only regular messages (exclude system messages)
      // System messages have a 't' property indicating their type
      return !msg.t;
    });
    
    return {
      success: true,
      messages: filteredMessages,
    };
  } catch (error) {
    console.error('[rocketchat] getMessages error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get messages',
    };
  }
};

// Send a message
export const sendMessage = async (roomId, message, authToken, userId) => {
  try {
    const response = await api.post('/chat.sendMessage', {
      message: {
        rid: roomId,
        msg: message,
      },
    }, {
      headers: getAuthHeaders(authToken, userId),
    });
    
    console.log('[rocketchat] sendMessage response:', response.data);
    
    return {
      success: true,
      message: response.data.message || response.data,
    };
  } catch (error) {
    console.error('[rocketchat] sendMessage error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to send message',
    };
  }
};

// Get room info
export const getRoomInfo = async (roomId, authToken, userId) => {
  try {
    const response = await api.get(`/rooms.info?roomId=${roomId}`, {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      room: response.data.room,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get room info',
    };
  }
};

// Get user presence information
export const getUserPresence = async (authToken, userId) => {
  try {
    const response = await api.get('/users.presence', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      presence: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user presence',
    };
  }
};

// Get all users in workspace
export const getAllUsers = async (authToken, userId) => {
  try {
    const response = await api.get('/users.list', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      users: response.data.users || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get users list',
    };
  }
};

// Get user status
export const getUserStatus = async (authToken, userId) => {
  try {
    const response = await api.get('/users.getStatus', {
      headers: getAuthHeaders(authToken, userId),
    });
    return {
      success: true,
      status: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user status',
    };
  }
};

// Get user's current room
export const getUserCurrentRoom = async (userId, authToken, currentUserId) => {
  try {
    const response = await api.get(`/users.getPresence?userId=${userId}`, {
      headers: getAuthHeaders(authToken, currentUserId),
    });
    return {
      success: true,
      room: response.data.room || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user current room',
    };
  }
};

// Get detailed user info including lastLogin
export const getUsersInfo = async (userId, authToken, currentUserId) => {
  try {
    const response = await api.get(`/users.info?userId=${userId}`, {
      headers: getAuthHeaders(authToken, currentUserId),
    });
    return {
      success: true,
      user: response.data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user info',
    };
  }
};

// Get user presence by userId
export const getUsersPresenceById = async (userId, authToken, currentUserId) => {
  try {
    const response = await api.get(`/users.getPresence?userId=${userId}`, {
      headers: getAuthHeaders(authToken, currentUserId),
    });
    return {
      success: true,
      presence: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get user presence',
    };
  }
};

// Logout
export const logout = async (authToken, userId) => {
  try {
    await api.post('/logout', {}, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Logout failed',
    };
  }
};

// === Additional helpers: Pins ===
export const getPinnedMessages = async (roomId, authToken, userId, count = 50, offset = 0) => {
  try {
    const response = await api.get(`/chat.getPinnedMessages?roomId=${roomId}&count=${count}&offset=${offset}`,
      { headers: getAuthHeaders(authToken, userId) }
    );
    
    // Filter out system messages from pinned messages
    const messages = response.data?.messages || [];
    const filteredMessages = messages.filter(msg => !msg.t);
    
    return {
      success: true,
      messages: filteredMessages,
      total: filteredMessages.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get pinned messages',
    };
  }
};

// === Additional helpers: Threads ===
export const getThreadsList = async (roomId, authToken, userId, count = 50, offset = 0) => {
  try {
    const response = await api.get(`/chat.getThreadsList`,
      { 
        headers: getAuthHeaders(authToken, userId),
        params: { rid: roomId, count, offset }
      }
    );
    return {
      success: true,
      threads: response.data?.threads || response.data?.messages || [],
      total: response.data?.total || 0,
    };
  } catch (error) {
    console.error('[rocketchat] getThreadsList error:', {
      status: error.response?.status,
      data: error.response?.data,
      roomId
    });
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get threads list',
    };
  }
};

export const getThreadMessages = async (tmid, authToken, userId, count = 50, offset = 0) => {
  try {
    const response = await api.get(`/chat.getThreadMessages`,
      { 
        headers: getAuthHeaders(authToken, userId),
        params: { tmid, count, offset }
      }
    );
    
    // Filter out system messages
    const messages = response.data?.messages || [];
    const filteredMessages = messages.filter(msg => !msg.t);
    
    return {
      success: true,
      messages: filteredMessages,
    };
  } catch (error) {
    console.error('[rocketchat] getThreadMessages error:', {
      status: error.response?.status,
      data: error.response?.data,
      tmid
    });
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get thread messages',
    };
  }
};

export const postThreadMessage = async (roomId, tmid, message, authToken, userId) => {
  try {
    console.log('[rocketchat] postThreadMessage request:', {
      roomId,
      tmid,
      message
    });
    const response = await api.post('/chat.sendMessage', {
      message: { rid: roomId, tmid, msg: message },
    }, { headers: getAuthHeaders(authToken, userId) });
    console.log('[rocketchat] postThreadMessage success:', response.data);
    return { success: true, message: response.data };
  } catch (error) {
    console.error('[rocketchat] postThreadMessage error:', {
      status: error.response?.status,
      data: error.response?.data,
      roomId,
      tmid
    });
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to send thread message',
    };
  }
};

// === Additional helpers: Search ===
export const searchMessages = async (query, authToken, userId, roomId = null, count = 100, offset = 0) => {
  try {
    console.log('[rocketchat] Starting search for:', query);
    let messages = [];
    
    if (roomId) {
      // Search in specific room using chat.search
      const response = await api.get('/chat.search', {
        headers: getAuthHeaders(authToken, userId),
        params: {
          roomId: roomId,
          searchText: query,
          count: count,
          offset: offset
        }
      });
      messages = response.data?.messages || [];
    } else {
      // Global search: Get all rooms and search in each
      console.log('[rocketchat] Performing global search across all rooms...');
      
      const roomsResponse = await api.get('/rooms.get', {
        headers: getAuthHeaders(authToken, userId)
      });
      
      const allRooms = roomsResponse.data?.update || [];
      console.log('[rocketchat] Searching in', allRooms.length, 'rooms');
      
      // Search in each room (limit to prevent overload)
      const searchPromises = allRooms.slice(0, 20).map(async (room) => {
        try {
          const searchResponse = await api.get('/chat.search', {
            headers: getAuthHeaders(authToken, userId),
            params: {
              roomId: room._id,
              searchText: query,
              count: 10
            }
          });
          
          if (searchResponse.data?.messages && searchResponse.data.messages.length > 0) {
            return searchResponse.data.messages.map(msg => ({
              ...msg,
              roomName: room.name || room.fname || 'Unknown',
              rid: room._id
            }));
          }
          return [];
        } catch (error) {
          console.log('[rocketchat] Could not search in room:', room.name, error.message);
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      messages = results.flat();
    }
    
    console.log('[rocketchat] Search complete. Found:', messages.length, 'messages');
    
    // Filter out system messages
    const filteredMessages = messages.filter(msg => !msg.t);
    
    // Sort by most recent first
    filteredMessages.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    
    return {
      success: true,
      messages: filteredMessages,
      total: filteredMessages.length,
      count: filteredMessages.length
    };
  } catch (error) {
    console.error('[rocketchat] searchMessages error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to search messages',
      messages: []
    };
  }
};

// === Insights and Analytics Functions ===
export const generateInsights = async (authToken, userId, timeRange = '7d') => {
  try {
    const insights = {
      topContributors: [],
      activeHours: {},
      popularChannels: [],
      messageStats: {
        totalMessages: 0,
        averagePerDay: 0,
        peakHour: 0
      },
      channelActivity: [],
      userActivity: []
    };

    // Get all rooms first
    const roomsResponse = await api.get('/rooms.get', {
      headers: getAuthHeaders(authToken, userId)
    });
    
    const rooms = roomsResponse.data?.update || [];
    console.log('[insights] Analyzing', rooms.length, 'rooms');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
    startDate.setDate(endDate.getDate() - days);

    let allMessages = [];
    const channelStats = {};
    const userStats = {};
    const hourlyStats = Array(24).fill(0);

    // Analyze each room
    for (const room of rooms.slice(0, 20)) { // Limit to prevent API overload
      try {
        let historyResponse;
        
        // Try different endpoints based on room type
        try {
          historyResponse = await api.get('/channels.history', {
            headers: getAuthHeaders(authToken, userId),
            params: {
              roomId: room._id,
              count: 100,
              latest: endDate.toISOString(),
              oldest: startDate.toISOString()
            }
          });
        } catch (channelError) {
          try {
            historyResponse = await api.get('/groups.history', {
              headers: getAuthHeaders(authToken, userId),
              params: {
                roomId: room._id,
                count: 100,
                latest: endDate.toISOString(),
                oldest: startDate.toISOString()
              }
            });
          } catch (groupError) {
            historyResponse = await api.get('/im.history', {
              headers: getAuthHeaders(authToken, userId),
              params: {
                roomId: room._id,
                count: 100,
                latest: endDate.toISOString(),
                oldest: startDate.toISOString()
              }
            });
          }
        }

        const messages = historyResponse.data?.messages || [];
        allMessages = allMessages.concat(messages);

        // Channel statistics
        channelStats[room._id] = {
          name: room.name || room.fname || 'Unknown',
          messageCount: messages.length,
          uniqueUsers: new Set(messages.map(m => m.u?._id)).size,
          lastActivity: messages.length > 0 ? messages[0].ts : null
        };

        // User statistics
        messages.forEach(msg => {
          const userId = msg.u?._id;
          const userName = msg.u?.username || 'Unknown';
          
          if (userId) {
            if (!userStats[userId]) {
              userStats[userId] = {
                username: userName,
                messageCount: 0,
                channels: new Set()
              };
            }
            userStats[userId].messageCount++;
            userStats[userId].channels.add(room._id);
          }

          // Hour analysis
          if (msg.ts) {
            const hour = new Date(msg.ts).getHours();
            hourlyStats[hour]++;
          }
        });

      } catch (roomError) {
        console.log('[insights] Could not analyze room:', room.name);
      }
    }

    // Process insights
    insights.messageStats.totalMessages = allMessages.length;
    insights.messageStats.averagePerDay = Math.round(allMessages.length / days);
    insights.messageStats.peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));

    // Top contributors
    insights.topContributors = Object.values(userStats)
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10)
      .map(user => ({
        username: user.username,
        messageCount: user.messageCount,
        channelCount: user.channels.size
      }));

    // Popular channels
    insights.popularChannels = Object.values(channelStats)
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    // Active hours
    insights.activeHours = hourlyStats.map((count, hour) => ({
      hour,
      count,
      label: `${hour}:00`
    }));

    // Channel activity
    insights.channelActivity = Object.values(channelStats);

    // User activity
    insights.userActivity = Object.values(userStats);

    console.log('[insights] Generated insights:', insights);
    return {
      success: true,
      data: insights
    };

  } catch (error) {
    console.error('[insights] Error generating insights:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate insights'
    };
  }
};

export const getChannelInsights = async (roomId, authToken, userId, timeRange = '7d') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
    startDate.setDate(endDate.getDate() - days);

    let historyResponse;
    
    // Try different endpoints based on room type
    try {
      historyResponse = await api.get('/channels.history', {
        headers: getAuthHeaders(authToken, userId),
        params: {
          roomId: roomId,
          count: 1000,
          latest: endDate.toISOString(),
          oldest: startDate.toISOString()
        }
      });
    } catch (channelError) {
      try {
        historyResponse = await api.get('/groups.history', {
          headers: getAuthHeaders(authToken, userId),
          params: {
            roomId: roomId,
            count: 1000,
            latest: endDate.toISOString(),
            oldest: startDate.toISOString()
          }
        });
      } catch (groupError) {
        historyResponse = await api.get('/im.history', {
          headers: getAuthHeaders(authToken, userId),
          params: {
            roomId: roomId,
            count: 1000,
            latest: endDate.toISOString(),
            oldest: startDate.toISOString()
          }
        });
      }
    }

    const messages = historyResponse.data?.messages || [];
    
    const insights = {
      totalMessages: messages.length,
      uniqueUsers: new Set(messages.map(m => m.u?._id)).size,
      averagePerDay: Math.round(messages.length / days),
      topUsers: {},
      messageTypes: {
        text: 0,
        files: 0,
        reactions: 0
      },
      timeline: []
    };

    // Analyze messages
    const userStats = {};
    const dailyStats = {};

    messages.forEach(msg => {
      const userId = msg.u?._id;
      const userName = msg.u?.username || 'Unknown';
      const date = new Date(msg.ts).toDateString();

      // User stats
      if (userId) {
        if (!userStats[userId]) {
          userStats[userId] = { username: userName, count: 0 };
        }
        userStats[userId].count++;
      }

      // Daily stats
      if (!dailyStats[date]) {
        dailyStats[date] = 0;
      }
      dailyStats[date]++;

      // Message types
      if (msg.file) {
        insights.messageTypes.files++;
      } else if (msg.reactions) {
        insights.messageTypes.reactions++;
      } else {
        insights.messageTypes.text++;
      }
    });

    insights.topUsers = Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    insights.timeline = Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      success: true,
      data: insights
    };

  } catch (error) {
    console.error('[insights] Error getting channel insights:', error);
    return {
      success: false,
      error: error.message || 'Failed to get channel insights'
    };
  }
};

// === Search-based Insights ===
export const generateSearchInsights = (searchResults) => {
  if (!searchResults || !searchResults.messages || searchResults.messages.length === 0) {
    return {
      success: false,
      error: 'No search results to analyze'
    };
  }

  const messages = searchResults.messages;
  const insights = {
    totalResults: messages.length,
    topContributors: [],
    activeChannels: [],
    messageTypes: {
      text: 0,
      files: 0,
      reactions: 0
    },
    timeDistribution: {},
    searchSummary: {
      uniqueUsers: new Set(messages.map(m => m.u?._id)).size,
      uniqueChannels: new Set(messages.map(m => m.rid)).size,
      dateRange: {
        earliest: null,
        latest: null
      }
    }
  };

  const userStats = {};
  const channelStats = {};
  const hourlyStats = Array(24).fill(0);

  // Analyze messages
  messages.forEach(msg => {
    // User statistics
    const userId = msg.u?._id;
    const userName = msg.u?.username || 'Unknown';
    
    if (userId) {
      if (!userStats[userId]) {
        userStats[userId] = { username: userName, count: 0 };
      }
      userStats[userId].count++;
    }

    // Channel statistics
    const channelId = msg.rid;
    const channelName = msg.roomName || msg.channelName || 'Unknown';
    
    if (channelId) {
      if (!channelStats[channelId]) {
        channelStats[channelId] = { name: channelName, count: 0 };
      }
      channelStats[channelId].count++;
    }

    // Message types
    if (msg.file) {
      insights.messageTypes.files++;
    } else if (msg.reactions) {
      insights.messageTypes.reactions++;
    } else {
      insights.messageTypes.text++;
    }

    // Time analysis
    if (msg.ts) {
      const date = new Date(msg.ts);
      const hour = date.getHours();
      hourlyStats[hour]++;

      // Date range
      if (!insights.searchSummary.dateRange.earliest || date < new Date(insights.searchSummary.dateRange.earliest)) {
        insights.searchSummary.dateRange.earliest = msg.ts;
      }
      if (!insights.searchSummary.dateRange.latest || date > new Date(insights.searchSummary.dateRange.latest)) {
        insights.searchSummary.dateRange.latest = msg.ts;
      }
    }
  });

  // Process results
  insights.topContributors = Object.values(userStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  insights.activeChannels = Object.values(channelStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  insights.timeDistribution = hourlyStats.map((count, hour) => ({
    hour,
    count,
    label: `${hour}:00`
  }));

  return {
    success: true,
    data: insights
  };
};

// === Additional helpers: User Status (DND etc.) ===
export const setUserStatus = async (status, message, authToken, userId) => {
  try {
    const response = await api.post('/users.setStatus', { status, message }, {
      headers: getAuthHeaders(authToken, userId),
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to set user status',
    };
  }
};

// === Additional helpers: Pin / Unpin Message ===
export const pinMessage = async (messageId, authToken, userId) => {
  try {
    if (!messageId || typeof messageId !== 'string') {
      return { success: false, error: 'Invalid messageId provided to pinMessage' };
    }
    console.log('[rocketchat] pinMessage -> request', {
      url: '/chat.pinMessage',
      messageId,
      userId,
    });
    const response = await api.post('/chat.pinMessage', { messageId }, {
      headers: getAuthHeaders(authToken, userId),
    });
    console.log('[rocketchat] pinMessage -> response', {
      status: response.status,
      success: response.data?.success,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[rocketchat] pinMessage -> error', {
      status: error.response?.status,
      data: error.response?.data,
      messageId,
      userId,
    });
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to pin message',
      status: error.response?.status,
      details: error.response?.data,
    };
  }
};

export const unpinMessage = async (messageId, authToken, userId) => {
  try {
    if (!messageId || typeof messageId !== 'string') {
      return { success: false, error: 'Invalid messageId provided to unpinMessage' };
    }
    console.log('[rocketchat] unpinMessage -> request', {
      url: '/chat.unPinMessage',
      messageId,
      userId,
    });
    const response = await api.post('/chat.unPinMessage', { messageId }, {
      headers: getAuthHeaders(authToken, userId),
    });
    console.log('[rocketchat] unpinMessage -> response', {
      status: response.status,
      success: response.data?.success,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[rocketchat] unpinMessage -> error', {
      status: error.response?.status,
      data: error.response?.data,
      messageId,
      userId,
    });
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to unpin message',
      status: error.response?.status,
      details: error.response?.data,
    };
  }
};

// === Additional helpers: Channel Members ===
export const getChannelMembers = async (roomId, authToken, userId, count = 1000, offset = 0) => {
  const endpoints = [
    `/channels.members?roomId=${roomId}&count=${count}&offset=${offset}`, // Public channels
    `/groups.members?roomId=${roomId}&count=${count}&offset=${offset}`,   // Private groups
    `/im.members?roomId=${roomId}&count=${count}&offset=${offset}`,       // Direct messages
  ];

  // Try each endpoint until one succeeds
  for (const endpoint of endpoints) {
    try {
      console.log(`[rocketchat] Trying to get members from: ${endpoint}`);
      const response = await api.get(endpoint, {
        headers: getAuthHeaders(authToken, userId)
      });
      
      if (response.data?.members) {
        console.log(`[rocketchat] Successfully fetched ${response.data.members.length} members`);
        return {
          success: true,
          members: response.data.members || [],
          total: response.data.total || response.data.members.length,
        };
      }
    } catch (error) {
      // Try next endpoint
      console.log(`[rocketchat] Endpoint ${endpoint} failed:`, error.response?.data?.error);
      continue;
    }
  }

  // If all endpoints fail, return error
  console.error('[rocketchat] All member endpoints failed for room:', roomId);
  return {
    success: false,
    error: 'Failed to get room members. Room type not supported or room not found.',
    members: [],
  };
};

// === Channel Creation ===
export const createChannel = async (name, members = [], isPrivate = false, readOnly = false, authToken, userId) => {
  try {
    console.log('[rocketchat] Creating channel:', { name, members, isPrivate, readOnly });
    
    const endpoint = isPrivate ? '/groups.create' : '/channels.create';
    const payload = {
      name: name,
    };
    
    // Add optional parameters
    if (members.length > 0) {
      payload.members = members;
    }
    if (readOnly) {
      payload.readOnly = true;
    }
    
    const response = await api.post(endpoint, payload, {
      headers: getAuthHeaders(authToken, userId)
    });
    
    console.log('[rocketchat] Create channel response:', response.data);
    
    if (response.data?.success) {
      const channelKey = isPrivate ? 'group' : 'channel';
      return {
        success: true,
        channel: response.data[channelKey],
        roomId: response.data[channelKey]?._id
      };
    } else {
      return {
        success: false,
        error: response.data?.error || 'Failed to create channel'
      };
    }
  } catch (error) {
    console.error('[rocketchat] createChannel error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.errorType || 'Failed to create channel',
      details: error.response?.data
    };
  }
};

// === Message Edit and Delete Functions ===
export const editMessage = async (messageId, newText, roomId, authToken, userId) => {
  try {
    console.log('[rocketchat] Editing message:', messageId, 'New text:', newText, 'in room:', roomId);
    
    const response = await api.post('/chat.update', {
      msgId: messageId,
      text: newText,
      roomId: roomId
    }, {
      headers: getAuthHeaders(authToken, userId)
    });

    console.log('[rocketchat] Edit message response:', response.data);
    
    if (response.data?.success) {
      return {
        success: true,
        message: response.data.message
      };
    } else {
      return {
        success: false,
        error: response.data?.error || 'Failed to edit message'
      };
    }
  } catch (error) {
    console.error('[rocketchat] editMessage error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to edit message'
    };
  }
};

export const deleteMessage = async (messageId, roomId, authToken, userId) => {
  try {
    console.log('[rocketchat] Deleting message:', messageId, 'in room:', roomId);
    
    const response = await api.post('/chat.delete', {
      msgId: messageId,
      roomId: roomId
    }, {
      headers: getAuthHeaders(authToken, userId)
    });

    console.log('[rocketchat] Delete message response:', response.data);
    
    if (response.data?.success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: response.data?.error || 'Failed to delete message'
      };
    }
  } catch (error) {
    console.error('[rocketchat] deleteMessage error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete message'
    };
  }
};

// === Video Call Functions ===
// Rocket.Chat supports video calls via Jitsi integration
export const startVideoCall = async (roomId, authToken, userId) => {
  try {
    console.log('[rocketchat] Starting video call for room:', roomId);
    
    // Create a video conference using Rocket.Chat's video-conference.start endpoint
    const response = await api.post('/video-conference/jitsi.update-timeout', {
      roomId: roomId
    }, {
      headers: getAuthHeaders(authToken, userId)
    });

    // Alternative: Send a slash command to start Jitsi call
    const callMessage = await api.post('/chat.sendMessage', {
      message: {
        rid: roomId,
        msg: '/jitsi'
      }
    }, {
      headers: getAuthHeaders(authToken, userId)
    });

    console.log('[rocketchat] Video call started:', callMessage.data);
    
    return {
      success: true,
      message: callMessage.data?.message
    };
  } catch (error) {
    console.error('[rocketchat] startVideoCall error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to start video call'
    };
  }
};

// Generate Jitsi meet URL for external video calls
export const generateVideoCallUrl = (roomId, roomName) => {
  // Generate a unique meeting ID based on room
  const meetingId = `rocketchat-${roomId.substring(0, 8)}`;
  const jitsiDomain = 'meet.jit.si'; // Use public Jitsi server or configure your own
  
  return {
    url: `https://${jitsiDomain}/${meetingId}`,
    meetingId: meetingId,
    roomName: roomName || 'Video Conference'
  };
};
