import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRooms, getMessages } from '../services/rocketchat';
import RoomList from './RoomList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TeamView from './TeamView';
import './ChatLayout.css';
import { usePrefs } from '../contexts/PrefsContext';
import PinsDashboard from './PinsDashboard';
import ThreadsView from './ThreadsView';
import SearchView from './SearchView';
import Insights from './Insights';
import CommandPalette from './CommandPalette';
import ThreadModal from './ThreadModal';
import VideoCallButton from './VideoCallButton';
import CreateChannel from './CreateChannel';
import { setUserStatus } from '../services/rocketchat';
import { requestNotificationPermission, notifyIfAllowed } from '../services/notifications';

const ChatLayout = () => {
  const { authToken, userId, user, logout } = useAuth();
  const { isDnd, setIsDnd } = usePrefs();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('rooms');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [threadMessage, setThreadMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission().then(result => {
      if (result.permission === 'granted') {
        console.log('[Notifications] Desktop notifications enabled');
      }
    });
  }, []);

  // Load rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      if (!authToken || !userId) return;
      
      try {
        const result = await getRooms(authToken, userId);
        if (result.success) {
          if (result.rooms && result.rooms.length > 0) {
            setRooms(result.rooms);
            setCurrentRoom(result.rooms[0]);
            setError('');
          } else {
            // No rooms available
            setRooms([]);
            setCurrentRoom(null);
            setError('No channels available. Please create or join a channel in Rocket.Chat.');
          }
        } else {
          setError(result.error || 'Failed to load channels');
        }
      } catch (err) {
        console.error('Error loading rooms:', err);
        setError('Unable to load channels. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [authToken, userId]);

  // Load messages when room changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentRoom || !authToken || !userId) {
        setMessages([]);
        return;
      }
      
      try {
        const result = await getMessages(currentRoom._id, authToken, userId);
        if (result.success) {
          setMessages(result.messages.reverse()); // Reverse to show oldest first
        } else {
          console.error('Failed to load messages:', result.error);
          setError(result.error || 'Failed to load messages');
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      }
    };

    loadMessages();
  }, [currentRoom, authToken, userId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!currentRoom || !authToken || !userId) return;

    const pollMessages = async () => {
      try {
        const result = await getMessages(currentRoom._id, authToken, userId);
        if (result.success) {
          const newMessages = result.messages.reverse();
          setMessages(prevMessages => {
            // Check if we have new messages
            if (newMessages.length > prevMessages.length) {
              // Find the new messages
              const newOnes = newMessages.slice(prevMessages.length);
              
              // Show notification for new messages from others
              newOnes.forEach(msg => {
                if (msg.u?._id !== userId) {
                  notifyIfAllowed({
                    isDnd,
                    title: `${msg.u?.name || msg.u?.username || 'Someone'} in #${currentRoom.name}`,
                    body: msg.msg || '(New message)',
                    icon: '/vite.svg',
                    tag: msg._id
                  });
                }
              });
              
              return newMessages;
            } else if (newMessages.length !== prevMessages.length) {
              return newMessages;
            }
            return prevMessages;
          });
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [currentRoom, authToken, userId, isDnd]);

  const handleRoomSelect = (room) => {
    setCurrentRoom(room);
    setMessages([]);
    // Close sidebar on mobile when room is selected
    setSidebarOpen(false);
  };

  const handleNewMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const handleMessageUpdate = (messageId, newText) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg._id === messageId 
          ? { ...msg, msg: newText, editedAt: new Date() }
          : msg
      )
    );
  };

  const handleMessageDelete = (messageId) => {
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg._id !== messageId)
    );
  };

  const handleStartThread = (message) => {
    setThreadMessage(message);
  };

  const reloadRooms = async () => {
    try {
      const result = await getRooms(authToken, userId);
      if (result.success && result.rooms) {
        setRooms(result.rooms);
      }
    } catch (err) {
      console.error('Error reloading rooms:', err);
    }
  };

  const handleChannelCreated = async (newChannel) => {
    console.log('[ChatLayout] New channel created:', newChannel);
    // Reload rooms to include the new channel
    await reloadRooms();
    // Switch to the new channel if available
    if (newChannel) {
      setCurrentRoom(newChannel);
      setActiveView('rooms');
    }
  };

  const handleCloseThread = () => {
    setThreadMessage(null);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleDnd = async () => {
    const next = !isDnd;
    setIsDnd(next);
    try {
      if (next) {
        await setUserStatus('busy', 'DND', authToken, userId);
      } else {
        await setUserStatus('online', '', authToken, userId);
      }
    } catch {}
  };

  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const runCommand = (cmd) => {
    if (cmd.startsWith('/search ')) {
      const q = cmd.slice(8);
      const url = new URL(window.location.href);
      url.searchParams.set('query', q);
      window.history.replaceState({}, '', url.toString());
      setActiveView('search');
      return;
    }
    if (cmd.startsWith('/status ')) {
      const arg = cmd.slice(8).trim();
      const map = { dnd: 'busy', busy: 'busy', away: 'away', online: 'online' };
      const status = map[arg] || 'online';
      if (arg === 'dnd') setIsDnd(true); else if (arg === 'online') setIsDnd(false);
      setUserStatus(status, arg === 'dnd' ? 'DND' : '', authToken, userId);
      return;
    }
    if (cmd.startsWith('/join ')) {
      const name = cmd.slice(6).replace(/^#/, '').trim();
      const found = rooms.find(r => (r.name || r.fname) === name);
      if (found) {
        setActiveView('rooms');
        setCurrentRoom(found);
      }
      return;
    }
  };

  if (loading) {
    return (
      <div className="chat-layout">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-layout">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <div className="chat-header">
        <div className="header-left">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Menu"
          >
            ☰
          </button>
          <div className="user-info">
            <span className="user-name">{user?.name || user?.username}</span>
            <span className="user-status">{isDnd ? 'DND' : 'Online'}</span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            onClick={toggleDnd} 
            className={`dnd-button ${isDnd ? 'active' : ''}`}
            title={isDnd ? 'Turn off Do Not Disturb' : 'Turn on Do Not Disturb'}
          >
            <span className="dnd-icon">{isDnd ? '🔕' : '🔔'}</span>
            <span className="dnd-text">{isDnd ? 'DND' : 'Available'}</span>
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <div className="chat-content">
        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-nav">
            <button 
              className={`nav-btn ${activeView === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveView('rooms')}
            >
              💬 Channels
            </button>
            <button 
              className={`nav-btn ${activeView === 'team' ? 'active' : ''}`}
              onClick={() => setActiveView('team')}
            >
              👥 Team View
            </button>
            <button 
              className={`nav-btn ${activeView === 'pins' ? 'active' : ''}`}
              onClick={() => setActiveView('pins')}
            >
              📌 Pins
            </button>
            <button 
              className={`nav-btn ${activeView === 'threads' ? 'active' : ''}`}
              onClick={() => setActiveView('threads')}
            >
              🧵 Threads
            </button>
            <button 
              className={`nav-btn ${activeView === 'search' ? 'active' : ''}`}
              onClick={() => setActiveView('search')}
            >
              🔎 Search
            </button>
            <button 
              className={`nav-btn ${activeView === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveView('insights')}
            >
              📊 Insights
            </button>
          </div>
          
          {/* Create Channel Button */}
          {activeView === 'rooms' && (
            <div className="sidebar-action">
              <button 
                className="create-channel-btn"
                onClick={() => setCreateChannelOpen(true)}
                title="Create New Channel"
              >
                ➕ Create Channel
              </button>
            </div>
          )}
          
          <div className="sidebar-body">
            {activeView === 'rooms' ? (
              <RoomList 
                rooms={rooms} 
                currentRoom={currentRoom} 
                onRoomSelect={handleRoomSelect} 
              />
            ) : activeView === 'team' ? (
              <TeamView rooms={rooms} currentRoom={currentRoom} />
            ) : activeView === 'pins' ? (
              <PinsDashboard rooms={rooms} />
            ) : activeView === 'threads' ? (
              <ThreadsView rooms={rooms} />
            ) : activeView === 'search' ? (
              <SearchView />
            ) : (
              <Insights />
            )}
          </div>
        </div>
        
        <div className="chat-area">
          {currentRoom ? (
            <>
              <div className="chat-header-room">
                <div className="room-title-section">
                  <div className="room-info">
                    <h3>#{currentRoom.name}</h3>
                    <p>{currentRoom.topic || 'No topic set'}</p>
                  </div>
                  <VideoCallButton 
                    roomId={currentRoom._id} 
                    roomName={currentRoom.name}
                  />
                </div>
              </div>
              
              <MessageList 
                messages={messages} 
                currentUserId={userId}
                roomId={currentRoom._id}
                onStartThread={handleStartThread}
                onMessageUpdate={handleMessageUpdate}
                onMessageDelete={handleMessageDelete}
              />
              
              <MessageInput 
                roomId={currentRoom._id}
                onNewMessage={handleNewMessage}
              />
            </>
          ) : (
            <div className="no-room-selected">
              {rooms.length === 0 ? (
                <>
                  <h3>📢 No Channels Available</h3>
                  <p>You need to create or join a channel to start chatting.</p>
                  <div style={{ marginTop: '20px', padding: '20px', background: '#f0f9ff', borderRadius: '12px', maxWidth: '500px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>How to create a channel:</h4>
                    <ol style={{ textAlign: 'left', margin: '0', paddingLeft: '20px', color: '#0c4a6e' }}>
                      <li>Open Rocket.Chat: <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: 'bold' }}>http://localhost:3000</a></li>
                      <li>Click the <strong>"+"</strong> button next to "Channels"</li>
                      <li>Enter channel name (e.g., "general")</li>
                      <li>Click <strong>"Create"</strong></li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    style={{
                      marginTop: '20px',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    🔄 Refresh Page
                  </button>
                </>
              ) : (
                <>
                  <h3>Select a room to start chatting</h3>
                  <p>Choose a room from the sidebar to view messages</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={runCommand} />
      {threadMessage && (
        <ThreadModal 
          message={threadMessage} 
          roomId={currentRoom?._id}
          onClose={handleCloseThread}
        />
      )}
      <CreateChannel 
        isOpen={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  );
};

export default ChatLayout;

