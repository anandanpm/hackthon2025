import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './Message.css';
import { useAuth } from '../contexts/AuthContext';
import { pinMessage, unpinMessage, editMessage, deleteMessage } from '../services/rocketchat';

const Message = ({ message, isOwn, roomId, onStartThread, onMessageUpdate, onMessageDelete }) => {
  const { authToken, userId } = useAuth();
  const [pinBusy, setPinBusy] = useState(false);
  const [pinned, setPinned] = useState(!!message.pinned);
  const [threadBusy, setThreadBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.msg || message.message || message.text || '');
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onTogglePin = async () => {
    if (!message._id || pinBusy) return;
    setPinBusy(true);
    try {
      if (!pinned) {
        const res = await pinMessage(message._id, authToken, userId);
        if (res.success) {
          setPinned(true);
          console.log('[Message] Message pinned successfully:', message._id);
        } else {
          console.error('[Message] Failed to pin message:', res.error);
        }
      } else {
        const res = await unpinMessage(message._id, authToken, userId);
        if (res.success) {
          setPinned(false);
          console.log('[Message] Message unpinned successfully:', message._id);
        } else {
          console.error('[Message] Failed to unpin message:', res.error);
        }
      }
    } catch (error) {
      console.error('[Message] Error toggling pin:', error);
    } finally {
      setPinBusy(false);
    }
  };

  const handleStartThread = async () => {
    if (onStartThread && message._id) {
      setThreadBusy(true);
      try {
        console.log('[Message] Starting thread for message:', message._id, message);
        await onStartThread(message);
        console.log('[Message] Thread started successfully:', message._id);
      } catch (error) {
        console.error('[Message] Error starting thread:', error);
      } finally {
        setThreadBusy(false);
      }
    } else {
      console.warn('[Message] Cannot start thread:', { onStartThread: !!onStartThread, messageId: message._id });
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditText(message.msg || message.message || message.text || '');
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(message.msg || message.message || message.text || '');
  };

  const handleEditSave = async () => {
    if (!message._id || editBusy || !editText.trim() || !roomId) return;
    
    setEditBusy(true);
    try {
      console.log('[Message] Editing message:', message._id, 'New text:', editText, 'in room:', roomId);
      const result = await editMessage(message._id, editText.trim(), roomId, authToken, userId);
      
      if (result.success) {
        console.log('[Message] Message edited successfully:', message._id, result.message);
        setIsEditing(false);
        // Notify parent component about the update with the backend response message if available
        if (onMessageUpdate) {
          const updatedText = result.message?.msg || editText.trim();
          onMessageUpdate(message._id, updatedText);
        }
      } else {
        console.error('[Message] Failed to edit message:', result.error);
        alert('Failed to edit message: ' + result.error);
      }
    } catch (error) {
      console.error('[Message] Error editing message:', error);
      alert('An error occurred while editing the message');
    } finally {
      setEditBusy(false);
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleDeleteMessage = async () => {
    if (!message._id || deleteBusy || !roomId) return;
    
    setDeleteBusy(true);
    try {
      console.log('[Message] Deleting message:', message._id, 'in room:', roomId);
      const result = await deleteMessage(message._id, roomId, authToken, userId);
      
      if (result.success) {
        console.log('[Message] Message deleted successfully:', message._id);
        setShowDeleteConfirm(false);
        // Notify parent component about the deletion
        if (onMessageDelete) {
          onMessageDelete(message._id);
        }
      } else {
        console.error('[Message] Failed to delete message:', result.error);
        alert('Failed to delete message: ' + result.error);
      }
    } catch (error) {
      console.error('[Message] Error deleting message:', error);
      alert('An error occurred while deleting the message');
    } finally {
      setDeleteBusy(false);
    }
  };

  // Get thread count from multiple possible sources
  const threadCount = message.tcount || message.replies?.length || 0;
  
  // Check if this message IS a thread (has tmid)
  const isThreadReply = !!message.tmid;
  
  // Helper function to safely get message content
  const getMessageContent = () => {
    const content = message.msg || message.message || message.text || '';
    // Ensure we return a string, not an object
    if (typeof content === 'object') {
      return JSON.stringify(content);
    }
    return content || '(No message content)';
  };
  
  // Log message data for debugging
  if (!message.msg && !message.message) {
    console.warn('[Message] Message has no content - ID:', message._id);
  }

  return (
    <div className={`message-container ${isOwn ? 'own' : 'other'} ${isThreadReply ? 'thread-reply' : ''}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="sender-name">
            {message.u?.name || message.u?.username || 'Unknown User'}
          </span>
          <span className="message-time">
            {formatTime(message.ts)}
          </span>
          
          {/* Only show actions if this is NOT already a thread reply */}
          {!isThreadReply && (
            <div className="message-actions">
              <button
                className={`message-pin-btn ${pinned ? 'active' : ''}`}
                title={pinned ? 'Unpin message' : 'Pin message'}
                onClick={onTogglePin}
                disabled={pinBusy}
              >
                📌
              </button>
              <button
                className="message-thread-btn"
                title={threadCount > 0 ? 'View thread' : 'Start thread'}
                onClick={handleStartThread}
                disabled={threadBusy}
              >
                💬
              </button>
              {/* Show edit and delete buttons only for own messages */}
              {isOwn && (
                <>
                  <button
                    className="message-edit-btn"
                    title="Edit message"
                    onClick={handleEditStart}
                    disabled={isEditing || editBusy}
                  >
                    ✏️
                  </button>
                  <button
                    className="message-delete-btn"
                    title="Delete message"
                    onClick={handleDeleteConfirm}
                    disabled={deleteBusy}
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="message-content">
          {isEditing ? (
            <div className="message-edit-form">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="message-edit-input"
                rows="3"
                disabled={editBusy}
                autoFocus
              />
              <div className="message-edit-actions">
                <button
                  className="message-edit-save"
                  onClick={handleEditSave}
                  disabled={editBusy || !editText.trim()}
                >
                  {editBusy ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="message-edit-cancel"
                  onClick={handleEditCancel}
                  disabled={editBusy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            getMessageContent()
          )}
        </div>
        
        {/* Show thread info if there are replies */}
        {threadCount > 0 && !isThreadReply && (
          <div className="message-thread-info" onClick={handleStartThread}>
            💬 {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
            {message.tlm && (
              <span className="thread-last-reply">
                · Last reply {formatTime(message.tlm)}
              </span>
            )}
          </div>
        )}
        
        {/* Show if this message is part of a thread */}
        {isThreadReply && (
          <div className="thread-indicator">
            ↪ Reply in thread
          </div>
        )}
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="attachment">
                {attachment.image_url && (
                  <img 
                    src={attachment.image_url} 
                    alt="Attachment" 
                    className="attachment-image"
                  />
                )}
                {attachment.title && (
                  <div className="attachment-title">{attachment.title}</div>
                )}
                {attachment.description && (
                  <div className="attachment-description">{attachment.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete confirmation dialog - rendered using portal */}
      {showDeleteConfirm && createPortal(
        <div className="message-delete-confirm" onClick={handleDeleteCancel}>
          <div className="delete-confirm-content" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to delete this message?</p>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-yes"
                onClick={handleDeleteMessage}
                disabled={deleteBusy}
              >
                {deleteBusy ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                className="delete-confirm-no"
                onClick={handleDeleteCancel}
                disabled={deleteBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Message;