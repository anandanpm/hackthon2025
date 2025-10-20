import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getThreadMessages, postThreadMessage } from '../services/rocketchat';
import './ThreadModal.css';

const ThreadModal = ({ message, roomId, onClose }) => {
  const { authToken, userId } = useAuth();
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadThreadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message._id]);

  const loadThreadMessages = async () => {
    if (!message._id || !authToken || !userId) return;
    
    setLoading(true);
    setError('');
    try {
      console.log('[ThreadModal] Loading thread messages for:', message._id);
      const res = await getThreadMessages(message._id, authToken, userId, 100, 0);
      if (res.success && res.messages) {
        const sorted = res.messages.sort((a, b) => new Date(a.ts) - new Date(b.ts));
        setThreadMessages(sorted);
        console.log('[ThreadModal] Loaded', sorted.length, 'thread messages');
      } else {
        setError(res.error || 'Failed to load thread messages');
        console.error('[ThreadModal] Failed to load thread messages:', res.error);
      }
    } catch (e) {
      console.error('[ThreadModal] Error loading thread messages:', e);
      setError('An error occurred while loading thread messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !authToken || !userId) return;
    
    setSending(true);
    setError('');
    try {
      console.log('[ThreadModal] Sending reply to thread:', message._id);
      const res = await postThreadMessage(
        roomId,
        message._id,
        replyText.trim(),
        authToken,
        userId
      );
      
      if (res.success) {
        setReplyText('');
        console.log('[ThreadModal] Reply sent successfully');
        await loadThreadMessages();
      } else {
        setError(res.error || 'Failed to send reply');
        console.error('[ThreadModal] Failed to send reply:', res.error);
      }
    } catch (e) {
      console.error('[ThreadModal] Error sending reply:', e);
      setError('An error occurred while sending reply');
    } finally {
      setSending(false);
    }
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
    <div className="thread-modal-overlay" onClick={onClose}>
      <div className="thread-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="thread-modal-header">
          <h3>💬 Thread</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Original Message */}
        <div className="thread-modal-original">
          <div className="message-header">
            <span 
              className="avatar" 
              style={{ 
                background: getAvatarColor(message.u?.name || message.u?.username || '?')
              }}
            >
              {(message.u?.name || message.u?.username || '?').charAt(0).toUpperCase()}
            </span>
            <div className="message-meta">
              <span className="author-name">
                {message.u?.name || message.u?.username || 'Unknown User'}
              </span>
              <span className="timestamp">
                {formatDate(message.ts)}
              </span>
            </div>
          </div>
          <div className="message-content">{getMessageContent(message)}</div>
        </div>

        {/* Thread Messages */}
        <div className="thread-modal-messages">
          {error && (
            <div className="error-state">
              <p>⚠️ {error}</p>
            </div>
          )}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading replies…</p>
            </div>
          ) : threadMessages.length === 0 ? (
            <div className="empty-state">
              <p>No replies yet. Be the first to reply!</p>
            </div>
          ) : (
            threadMessages.map((msg) => (
              <div key={msg._id} className="thread-reply">
                <span 
                  className="avatar" 
                  style={{ 
                    background: getAvatarColor(msg.u?.name || msg.u?.username || '?')
                  }}
                >
                  {(msg.u?.name || msg.u?.username || '?').charAt(0).toUpperCase()}
                </span>
                <div className="reply-content-wrapper">
                  <div className="reply-header">
                    <span className="author-name">
                      {msg.u?.name || msg.u?.username || 'Unknown User'}
                    </span>
                    <span className="timestamp">
                      {formatDate(msg.ts)}
                    </span>
                  </div>
                  <div className="reply-content">{getMessageContent(msg)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Input */}
        <div className="thread-modal-reply">
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
            disabled={sending}
          />
          <button 
            onClick={handleSendReply} 
            disabled={!replyText.trim() || sending}
            className="send-btn"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadModal;
