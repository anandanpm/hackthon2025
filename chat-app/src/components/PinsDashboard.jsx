import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPinnedMessages } from '../services/rocketchat';
import './PinsDashboard.css';

const PinsDashboard = ({ rooms = [] }) => {
  const { authToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pins, setPins] = useState([]);
  const [query, setQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [myPinsOnly, setMyPinsOnly] = useState(false);

  const roomOptions = useMemo(() => [
    { _id: 'all', name: 'All Channels' },
    ...rooms
  ], [rooms]);

  const loadPins = async () => {
    if (!authToken || !userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      let allPins = [];
      const targetRooms = roomFilter === 'all' 
        ? rooms 
        : rooms.filter(r => r._id === roomFilter);

      // Fetch pins from all target rooms
      for (const room of targetRooms) {
        const res = await getPinnedMessages(room._id, authToken, userId, 100, 0);
        if (res.success && res.messages) {
          const mappedMessages = res.messages.map(msg => ({
            ...msg,
            _room: room
          }));
          allPins = allPins.concat(mappedMessages);
        }
      }

      // Sort by most recent first
      allPins.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      setPins(allPins);
    } catch (e) {
      console.error('Error loading pinned messages:', e);
      setError('Failed to load pinned messages. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, userId, roomFilter]);

  const isPinnedByMe = (pin) => {
    const id = pin?.pinnedBy?._id || pin?.pinned_by?._id;
    return !!(id && userId && id === userId);
  };

  const filteredPins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pins
      .filter(pin => (myPinsOnly ? isPinnedByMe(pin) : true))
      .filter(pin => {
        if (!q) return true;
        const msgText = (pin.msg || '').toLowerCase();
        const userName = (pin.u?.name || pin.u?.username || '').toLowerCase();
        const roomName = (pin._room?.name || pin._room?.fname || '').toLowerCase();
        return msgText.includes(q) || userName.includes(q) || roomName.includes(q);
      });
  }, [pins, query, myPinsOnly, userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPins();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#4facfe',
      '#43e97b', '#fa709a', '#fee140', '#30cfd0'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const getMessageContent = (msg) => {
    const content = msg.msg || msg.message || '';
    // Ensure we return a string, not an object
    if (typeof content === 'object') {
      return JSON.stringify(content);
    }
    return content || '(No content)';
  };

  return (
    <div className="pins">
      {/* Header Section */}
      <div className="pins-header">
        <div className="left">
          <h3>Pinned Messages</h3>
          <div className="sub">
            {pins.length} {pins.length === 1 ? 'pin' : 'pins'} across {rooms.length} {rooms.length === 1 ? 'channel' : 'channels'}
          </div>
        </div>
        <div className="right">
          <select 
            value={roomFilter} 
            onChange={(e) => setRoomFilter(e.target.value)}
            aria-label="Filter by channel"
          >
            {roomOptions.map(r => (
              <option key={r._id} value={r._id}>
                {r.name || r.fname || '#unknown'}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search pins..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search pinned messages"
          />
          <button
            type="button"
            className={`my-pins-btn ${myPinsOnly ? 'active' : ''}`}
            onClick={() => setMyPinsOnly(v => !v)}
            title="Show only messages you pinned"
            aria-pressed={myPinsOnly}
          >
            My Pins
          </button>
          <button 
            className="refresh" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            title="Refresh pinned messages"
            aria-label="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && pins.length === 0 ? (
        <div className="pins-state">
          <div className="loading-spinner"></div>
          <p>Loading pinned messages…</p>
        </div>
      ) : error ? (
        <div className="pins-state error">
          ⚠️ {error}
        </div>
      ) : filteredPins.length === 0 ? (
        <div className="pins-state">
          {query.trim() ? (
            <>
              <p>No pins match your search</p>
              <button 
                onClick={() => setQuery('')}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'var(--brand)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear Search
              </button>
            </>
          ) : (
            <p>No pinned messages found. Pin important messages to see them here!</p>
          )}
        </div>
      ) : (
        <div className={`pins-grid ${roomFilter !== 'all' ? 'single' : ''}`}>
          {filteredPins.map((pin) => (
            <div key={pin._id} className="pin-card">
              {/* Card Header */}
              <div className="pin-card-header">
                <div className="room">
                  {pin._room?.name || pin._room?.fname || 'channel'}
                </div>
                <div className="time" title={new Date(pin.ts).toLocaleString()}>
                  {formatDate(pin.ts)}
                </div>
              </div>

              {/* Author Info */}
              <div className="pin-author">
                <span 
                  className="avatar" 
                  style={{ 
                    background: getAvatarColor(pin.u?.name || pin.u?.username || '?')
                  }}
                  aria-hidden="true"
                >
                  {(pin.u?.name || pin.u?.username || '?').charAt(0).toUpperCase()}
                </span>
                <span className="name">
                  {pin.u?.name || pin.u?.username || 'Unknown User'}
                </span>
              </div>

              {/* Full pinned message body */}
              {pin.msg && (
                <div className="pin-body">{getMessageContent(pin)}</div>
              )}

              {/* Attachments */}
              {pin.attachments && pin.attachments.length > 0 && (
                <div className="pin-attachments">
                  {pin.attachments.map((attachment, index) => (
                    <div key={index} className="att">
                      {attachment.image_url && (
                        <img 
                          src={attachment.image_url} 
                          alt={attachment.title || 'Attachment'} 
                          loading="lazy"
                        />
                      )}
                      {attachment.title && (
                        <div className="title">{attachment.title}</div>
                      )}
                      {attachment.description && (
                        <div className="desc">{attachment.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PinsDashboard;