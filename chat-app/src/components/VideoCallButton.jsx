import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { startVideoCall, generateVideoCallUrl } from '../services/rocketchat';
import './VideoCallButton.css';

const VideoCallButton = ({ roomId, roomName }) => {
  const { authToken, userId } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [callUrl, setCallUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleStartCall = async () => {
    if (!roomId || isStarting) return;
    
    setIsStarting(true);
    try {
      console.log('[VideoCall] Starting video call in room:', roomId);
      
      // Try Rocket.Chat's native video call integration
      const result = await startVideoCall(roomId, authToken, userId);
      
      if (result.success) {
        console.log('[VideoCall] Video call started successfully');
        const callInfo = generateVideoCallUrl(roomId, roomName);
        setCallUrl(callInfo.url);
        setShowModal(true);
      } else {
        console.log('[VideoCall] Failed to start native call, using external Jitsi');
        // Fallback: Use external Jitsi
        handleExternalCall();
      }
    } catch (error) {
      console.error('[VideoCall] Error:', error);
      // Fallback to external Jitsi
      handleExternalCall();
    } finally {
      setIsStarting(false);
    }
  };

  const handleExternalCall = () => {
    const callInfo = generateVideoCallUrl(roomId, roomName);
    console.log('[VideoCall] Opening external Jitsi:', callInfo.url);
    
    setCallUrl(callInfo.url);
    setShowModal(true);
    
    // Open in new window
    window.open(callInfo.url, '_blank', 'width=1200,height=800');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(callUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[VideoCall] Failed to copy:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCopied(false);
  };

  const handleJoinCall = () => {
    window.open(callUrl, '_blank', 'width=1200,height=800');
  };

  return (
    <>
      <div className="video-call-container">
        <button 
          className="video-call-btn"
          onClick={handleStartCall}
          disabled={isStarting || !roomId}
          title="Start video call"
        >
          {isStarting ? '⏳' : '📹'}
          <span className="video-call-text">
            {isStarting ? 'Starting...' : 'Video Call'}
          </span>
        </button>
      </div>

      {/* Video Call Modal - rendered using portal */}
      {showModal && createPortal(
        <div className="video-call-modal-overlay" onClick={handleCloseModal}>
          <div className="video-call-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📹 Video Call Started</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-icon">
                <div className="video-icon-circle">
                  <span className="video-icon">🎥</span>
                </div>
              </div>

              <p className="modal-message">
                Your video conference is ready! Share this link with participants:
              </p>

              <div className="link-container">
                <input 
                  type="text" 
                  value={callUrl} 
                  readOnly 
                  className="link-input"
                  onClick={(e) => e.target.select()}
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-primary"
                  onClick={handleJoinCall}
                >
                  🚀 Join Call
                </button>
                <button 
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
              </div>

              <div className="modal-footer">
                <p className="modal-hint">
                  💡 The link opens in Jitsi Meet - no account required
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default VideoCallButton;
