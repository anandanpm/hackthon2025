import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getThreadsList, getThreadMessages, postThreadMessage } from '../services/rocketchat';
import './ThreadsView.css';

const ThreadsView = ({ rooms = [] }) => {
  const { authToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [threads, setThreads] = useState([]);
  const [query, setQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [messageError, setMessageError] = useState('');

  const roomOptions = useMemo(() => [
    { _id: 'all', name: 'All Channels' },
    ...rooms
  ], [rooms]);

  const loadThreads = async () => {
    if (!authToken || !userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      let allThreads = [];
      const targetRooms = roomFilter === 'all' 
        ? rooms 
        : rooms.filter(r => r._id === roomFilter);

      // Fetch threads from all target rooms
      for (const room of targetRooms) {
        const res = await getThreadsList(room._id, authToken, userId, 100, 0);
        if (res.success && res.threads) {
          const mappedThreads = res.threads.map(thread => ({
            ...thread,
            _room: room
          }));
          allThreads = allThreads.concat(mappedThreads);
        }
      }

      // Sort by most recent first
      allThreads.sort((a, b) => new Date(b.ts || b._updatedAt) - new Date(a.ts || a._updatedAt));
      setThreads(allThreads);
    } catch (e) {
      console.error('Error loading threads:', e);
      setError('Failed to load threads. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, userId, roomFilter]);

  const loadThreadMessages = async (thread) => {
    if (!authToken || !userId || !thread._id) return;
    
    setLoadingMessages(true);
    setSelectedThread(thread);
    setThreadMessages([]);
    setMessageError('');
    
    try {
      console.log('[ThreadsView] Loading thread messages for:', thread._id);
      const res = await getThreadMessages(thread._id, authToken, userId, 100, 0);
      console.log('[ThreadsView] Thread messages response:', res);
      
      if (res.success && res.messages) {
        // Sort messages by timestamp
        const sorted = res.messages.sort((a, b) => new Date(a.ts) - new Date(b.ts));
        console.log('[ThreadsView] Loaded', sorted.length, 'thread messages:', sorted);
        setThreadMessages(sorted);
      } else {
        setMessageError(res.error || 'Failed to load thread messages');
        console.error('[ThreadsView] Failed to load thread messages:', res.error);
      }
    } catch (e) {
      console.error('[ThreadsView] Error loading thread messages:', e);
      setMessageError('An error occurred while loading messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread || !authToken || !userId) return;
    
    setSendingReply(true);
    setMessageError('');
    try {
      console.log('[ThreadsView] Sending reply to thread:', selectedThread._id);
      const res = await postThreadMessage(
        selectedThread.rid || selectedThread._room?._id,
        selectedThread._id,
        replyText.trim(),
        authToken,
        userId
      );
      
      if (res.success) {
        setReplyText('');
        console.log('[ThreadsView] Reply sent successfully');
        // Reload thread messages
        await loadThreadMessages(selectedThread);
      } else {
        setMessageError(res.error || 'Failed to send reply');
        console.error('[ThreadsView] Failed to send reply:', res.error);
      }
    } catch (e) {
      console.error('[ThreadsView] Error sending reply:', e);
      setMessageError('An error occurred while sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter(thread => {
      if (!q) return true;
      const msgText = (thread.msg || '').toLowerCase();
      const userName = (thread.u?.name || thread.u?.username || '').toLowerCase();
      const roomName = (thread._room?.name || thread._room?.fname || '').toLowerCase();
      return msgText.includes(q) || userName.includes(q) || roomName.includes(q);
    });
  }, [threads, query]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadThreads();
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
    return content || '(No message content)';
  };

  const closeThreadView = () => {
    setSelectedThread(null);
    setThreadMessages([]);
    setReplyText('');
  };

  return (
    <div className="threads">
      {/* Header Section */}
      <div className="threads-header">
        <div className="left">
          <h3>All Threads</h3>
          <div className="sub">
            {threads.length} {threads.length === 1 ? 'thread' : 'threads'} across {rooms.length} {rooms.length === 1 ? 'channel' : 'channels'}
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
            placeholder="Search threads..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search threads"
          />
          <button 
            className="refresh" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            title="Refresh threads"
            aria-label="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && threads.length === 0 ? (
        <div className="threads-state">
          <div className="loading-spinner"></div>
          <p>Loading threads…</p>
        </div>
      ) : error ? (
        <div className="threads-state error">
          ⚠️ {error}
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="threads-state">
          {query.trim() ? (
            <>
              <p>No threads match your search</p>
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
            <p>No threads found. Start a thread in any channel to see it here!</p>
          )}
        </div>
      ) : (
        <div className="threads-container">
          {/* Thread List */}
          <div className={`threads-list ${selectedThread ? 'collapsed' : ''}`}>
            {filteredThreads.map((thread) => (
              <div 
                key={thread._id} 
                className={`thread-card ${selectedThread?._id === thread._id ? 'active' : ''}`}
                onClick={() => loadThreadMessages(thread)}
              >
                {/* Thread Header */}
                <div className="thread-card-header">
                  <div className="room">
                    {thread._room?.name || thread._room?.fname || 'channel'}
                  </div>
                  <div className="time" title={new Date(thread.ts || thread._updatedAt).toLocaleString()}>
                    {formatDate(thread.ts || thread._updatedAt)}
                  </div>
                </div>

                {/* Author Info */}
                <div className="thread-author">
                  <span 
                    className="avatar" 
                    style={{ 
                      background: getAvatarColor(thread.u?.name || thread.u?.username || '?')
                    }}
                    aria-hidden="true"
                  >
                    {(thread.u?.name || thread.u?.username || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="name">
                    {thread.u?.name || thread.u?.username || 'Unknown User'}
                  </span>
                </div>

                {/* Thread message body */}
                {thread.msg && (
                  <div className="thread-body">{getMessageContent(thread)}</div>
                )}

                {/* Thread stats */}
                <div className="thread-stats">
                  <span className="replies-count">
                    💬 {thread.tcount || thread.replies?.length || 0} {(thread.tcount || thread.replies?.length || 0) === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Thread Detail View */}
          {selectedThread && (
            <div className="thread-detail">
              <div className="thread-detail-header">
                <button className="back-btn" onClick={closeThreadView}>
                  ← Back
                </button>
                <div className="thread-title">
                  <span className="room-name">
                    #{selectedThread._room?.name || selectedThread._room?.fname || 'channel'}
                  </span>
                  <span className="thread-info">Thread</span>
                </div>
              </div>

              {/* Original Thread Message */}
              <div className="thread-original">
                <div className="message-header">
                  <span 
                    className="avatar" 
                    style={{ 
                      background: getAvatarColor(selectedThread.u?.name || selectedThread.u?.username || '?')
                    }}
                  >
                    {(selectedThread.u?.name || selectedThread.u?.username || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="message-meta">
                    <span className="author-name">
                      {selectedThread.u?.name || selectedThread.u?.username || 'Unknown User'}
                    </span>
                    <span className="timestamp">
                      {formatDate(selectedThread.ts || selectedThread._updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="message-content">{getMessageContent(selectedThread)}</div>
              </div>

              {/* Thread Messages */}
              <div className="thread-messages">
                {messageError && (
                  <div className="error-state">
                    <p>⚠️ {messageError}</p>
                  </div>
                )}
                {loadingMessages ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading messages…</p>
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="empty-state">
                    <p>No replies yet. Be the first to reply!</p>
                  </div>
                ) : (
                  threadMessages.map((msg) => (
                    <div key={msg._id || Math.random()} className="thread-message">
                      <span 
                        className="avatar" 
                        style={{ 
                          background: getAvatarColor(msg.u?.name || msg.u?.username || '?')
                        }}
                      >
                        {(msg.u?.name || msg.u?.username || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="message-content-wrapper">
                        <div className="message-header">
                          <span className="author-name">
                            {msg.u?.name || msg.u?.username || 'Unknown User'}
                          </span>
                          <span className="timestamp">
                            {formatDate(msg.ts || msg._updatedAt)}
                          </span>
                        </div>
                        <div className="message-content">
                          {getMessageContent(msg)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="thread-reply">
                <textarea
                  placeholder="Reply to thread..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  disabled={sendingReply}
                />
                <button 
                  onClick={handleSendReply} 
                  disabled={!replyText.trim() || sendingReply}
                  className="send-btn"
                >
                  {sendingReply ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadsView;
