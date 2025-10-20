import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { createChannel, getAllUsers } from '../services/rocketchat';
import './CreateChannel.css';

const CreateChannel = ({ isOpen, onClose, onChannelCreated }) => {
  const { authToken, userId } = useAuth();
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdChannel, setCreatedChannel] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Load users when modal opens
  useEffect(() => {
    if (isOpen && authToken && userId) {
      loadUsers();
    }
  }, [isOpen, authToken, userId]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await getAllUsers(authToken, userId);
      if (result.success && result.users) {
        // Filter out the current user
        const otherUsers = result.users.filter(u => u._id !== userId && u.active !== false);
        setUsers(otherUsers);
      }
    } catch (err) {
      console.error('[CreateChannel] Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleMember = (username) => {
    setSelectedMembers(prev => {
      if (prev.includes(username)) {
        return prev.filter(u => u !== username);
      } else {
        return [...prev, username];
      }
    });
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }
    
    // Channel name validation (Rocket.Chat rules)
    const nameRegex = /^[a-zA-Z0-9-_.]+$/;
    if (!nameRegex.test(channelName)) {
      setError('Channel name can only contain letters, numbers, hyphens, underscores, and periods');
      return;
    }
    
    if (channelName.length < 2) {
      setError('Channel name must be at least 2 characters');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      console.log('[CreateChannel] Creating channel:', channelName, 'with members:', selectedMembers);
      const result = await createChannel(
        channelName,
        selectedMembers, // selected member usernames
        isPrivate,
        readOnly,
        authToken,
        userId
      );
      
      if (result.success) {
        console.log('[CreateChannel] Channel created successfully:', result.channel);
        
        // Generate invite link
        const baseUrl = window.location.origin;
        const rocketChatUrl = import.meta.env.VITE_ROCKETCHAT_URL;
        const channelPath = isPrivate ? 'group' : 'channel';
        const link = `${rocketChatUrl}/${channelPath}/${result.channel.name}`;
        
        setCreatedChannel(result.channel);
        setInviteLink(link);
        setShowSuccess(true);
        
        // Notify parent
        if (onChannelCreated) {
          onChannelCreated(result.channel);
        }
      } else {
        console.error('[CreateChannel] Failed to create channel:', result.error);
        setError(result.error || 'Failed to create channel');
      }
    } catch (err) {
      console.error('[CreateChannel] Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('[CreateChannel] Failed to copy link:', error);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setChannelName('');
      setIsPrivate(false);
      setReadOnly(false);
      setSelectedMembers([]);
      setSearchQuery('');
      setError('');
      setShowSuccess(false);
      setCreatedChannel(null);
      setInviteLink('');
      setLinkCopied(false);
      onClose();
    }
  };

  const handleDone = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="create-channel-overlay" onClick={!showSuccess ? handleClose : undefined}>
      <div className="create-channel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{showSuccess ? '✅ Channel Created!' : '📢 Create New Channel'}</h3>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={isCreating}
          >
            ✕
          </button>
        </div>

        {showSuccess ? (
          <div className="modal-body success-view">
            <div className="success-icon">
              <div className="success-circle">
                <span className="success-check">✓</span>
              </div>
            </div>

            <h4 className="success-title">
              Channel #{createdChannel?.name} created successfully!
            </h4>
            
            <p className="success-message">
              {isPrivate ? '🔒 This is a private channel. ' : '🌐 This is a public channel. '}
              {selectedMembers.length > 0 
                ? `${selectedMembers.length} member(s) have been invited.`
                : 'You can now invite members to join.'}
            </p>

            <div className="invite-section">
              <label className="invite-label">
                📎 Share Invite Link
              </label>
              <div className="invite-link-container">
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  className="invite-link-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className={`copy-link-btn ${linkCopied ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {linkCopied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <small className="invite-hint">
                Share this link with people you want to invite to the channel
              </small>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="btn-done"
                onClick={handleDone}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="channelName">
              Channel Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="channelName"
              className="form-input"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value.toLowerCase())}
              placeholder="e.g., general, announcements"
              disabled={isCreating}
              autoFocus
            />
            <small className="form-hint">
              Use lowercase letters, numbers, hyphens, and underscores only
            </small>
          </div>

          {/* Member Selection */}
          <div className="form-group">
            <label htmlFor="members">
              Add Members (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or username..."
              disabled={isCreating || loadingUsers}
            />
            <small className="form-hint">
              {selectedMembers.length > 0 
                ? `${selectedMembers.length} member(s) selected` 
                : 'Search and select members to add'}
            </small>
            
            {loadingUsers ? (
              <div className="members-loading">
                <span className="spinner"></span>
                Loading users...
              </div>
            ) : (
              <div className="members-list">
                {filteredUsers.length === 0 ? (
                  <div className="no-users">
                    {searchQuery ? 'No users found' : 'No users available'}
                  </div>
                ) : (
                  filteredUsers.slice(0, 10).map(user => (
                    <div
                      key={user._id}
                      className={`member-item ${selectedMembers.includes(user.username) ? 'selected' : ''}`}
                      onClick={() => !isCreating && toggleMember(user.username)}
                    >
                      <div className="member-avatar">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <div className="member-name">{user.name || user.username}</div>
                        <div className="member-username">@{user.username}</div>
                      </div>
                      {selectedMembers.includes(user.username) && (
                        <div className="member-check">✓</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isCreating}
              />
              <span className="checkbox-text">
                <strong>🔒 Private Channel</strong>
                <small>Only invited members can access</small>
              </span>
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(e) => setReadOnly(e.target.checked)}
                disabled={isCreating}
              />
              <span className="checkbox-text">
                <strong>📖 Read-Only</strong>
                <small>Only admins can post messages</small>
              </span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={isCreating || !channelName.trim()}
            >
              {isCreating ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  ✨ Create Channel
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CreateChannel;
