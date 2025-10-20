import React, { useEffect, useMemo, useState } from 'react';
import {
  getAllUsers,
  getUsersPresenceById,
  getUsersInfo,
  getChannelMembers,
} from '../services/rocketchat';
import { useAuth } from '../contexts/AuthContext';
import './TeamView.css';

const TeamView = ({ rooms = [], currentRoom = null }) => {
  const { authToken, userId } = useAuth();

  const [users, setUsers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(currentRoom?._id || 'all');

  const roomOptions = useMemo(() => [{ _id: 'all', name: 'All Channels' }, ...rooms], [rooms]);

  // ✅ Fetch team members and their presence
  const loadTeamMembers = async () => {
    if (!authToken || !userId) return;

    try {
      setLoading(true);
      setError(null);

      let sourceUsers = [];
      if (selectedRoomId && selectedRoomId !== 'all') {
        // Load channel members
        const membersRes = await getChannelMembers(selectedRoomId, authToken, userId, 1000, 0);
        if (membersRes.success) {
          sourceUsers = membersRes.members || [];
        } else {
          setError(membersRes.error || 'Failed to fetch channel members');
          sourceUsers = [];
        }
      } else {
        // Fallback to all users
        const result = await getAllUsers(authToken, userId);
        if (result.success) {
          sourceUsers = result.users || [];
        } else {
          setError(result.error || 'Failed to fetch users');
          sourceUsers = [];
        }
      }

      const activeUsers = sourceUsers.filter(
        (member) => member.active !== false && (member.type ? member.type === 'user' : true) && member._id !== userId
      );

      const usersWithPresence = await Promise.all(
        activeUsers.map(async (member) => {
          const presenceData = await getUsersPresenceById(
            member._id,
            authToken,
            userId
          );
          const infoData = await getUsersInfo(member._id, authToken, userId);
          return {
            _id: member._id,
            name: member.name || member.username,
            username: member.username,
            status: presenceData.success
              ? presenceData.presence.presence
              : 'offline',
            statusMessage: presenceData.success
              ? presenceData.presence.statusText || ''
              : '',
            lastSeen: infoData.success && infoData.user?.lastLogin
              ? new Date(infoData.user.lastLogin).toLocaleString()
              : 'Unknown',
            currentRoom: presenceData.success
              ? presenceData.presence.connectionStatus || '-'
              : '-',
          };
        })
      );

      setUsers(usersWithPresence);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
    const interval = setInterval(loadTeamMembers, 30000);
    return () => clearInterval(interval);
  }, [authToken, userId, selectedRoomId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTeamMembers();
  };

  const filteredUsers =
    filter === 'all'
      ? users
      : users.filter((u) => u.status.toLowerCase() === filter);

  // Helper: status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#28a745';
      case 'away':
        return '#ffc107';
      case 'busy':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Helper: avatar background color
  const getAvatarColor = (name) => {
    const colors = ['#667eea', '#764ba2', '#43cea2', '#f3904f', '#e94e77'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // --- UI rendering ---

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading team members...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  if (users.length === 0) {
    return <div className="no-members">No team members found</div>;
  }

  return (
    <div className="team-view">
      {/* Header */}
      <div className="team-view-header">
        <div className="header-left">
          <h3> Team View</h3>
          <span className="last-updated">
            Last updated{' '}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
          </span>
        </div>

        <div className="header-right">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="room-select"
            title="Filter by channel"
          >
            {roomOptions.map(r => (
              <option key={r._id} value={r._id}>
                {r.name || r.fname || 'channel'}
              </option>
            ))}
          </select>
          <div className="team-stats">
            <div className="stat-item">
              🟢 Online: {users.filter((u) => u.status === 'online').length}
            </div>
            <div className="stat-item">
              🟡 Away: {users.filter((u) => u.status === 'away').length}
            </div>
            <div className="stat-item">
              🔴 Busy: {users.filter((u) => u.status === 'busy').length}
            </div>
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh team data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="team-filters">
        {['all', 'online', 'away', 'busy', 'offline'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Team Members */}
      <div className="team-members">
        {filteredUsers.map((user) => (
          <div key={user._id} className="team-member">
            <div className="member-avatar">
              <div
                className="avatar-circle"
                style={{ backgroundColor: getAvatarColor(user.name) }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <span
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(user.status) }}
              ></span>
            </div>

            <div className="member-info">
              <div className="member-name">{user.name}</div>
              <div className="member-status">
                <span className="status-icon">•</span>
                <span className="status-text">{user.status}</span>
              </div>
              {user.statusMessage && (
                <div className="status-message">{user.statusMessage}</div>
              )}
            </div>

            <div className="member-details">
              <div className="last-active">{user.lastSeen}</div>
              <div className="current-room">{user.currentRoom}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamView;
