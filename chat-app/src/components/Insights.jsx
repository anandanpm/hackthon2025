import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateInsights, getChannelInsights } from '../services/rocketchat';
import './Insights.css';

const Insights = ({ roomId = null }) => {
  const { authToken, userId } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [viewType, setViewType] = useState('global'); // 'global' or 'channel'

  useEffect(() => {
    if (authToken && userId) {
      loadInsights();
    } else {
      console.warn('[Insights] Missing auth credentials:', { authToken: !!authToken, userId: !!userId });
      setLoading(false);
      setError('Authentication required to load insights');
    }
  }, [authToken, userId, timeRange, viewType, roomId]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[Insights] Loading insights with:', { authToken: !!authToken, userId, timeRange, viewType, roomId });
      let result;
      if (viewType === 'channel' && roomId) {
        result = await getChannelInsights(roomId, authToken, userId, timeRange);
      } else {
        result = await generateInsights(authToken, userId, timeRange);
      }
      
      console.log('[Insights] Result:', result);
      
      if (result.success) {
        setInsights(result.data);
      } else {
        setError(result.error || 'Failed to load insights');
      }
    } catch (err) {
      console.error('[Insights] Error:', err);
      setError('Error loading insights: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  if (loading) {
    return (
      <div className="insights-container">
        <div className="insights-header">
          <h3>📊 Chat Insights</h3>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing chat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-container">
        <div className="insights-header">
          <h3>📊 Chat Insights</h3>
        </div>
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadInsights} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="insights-container">
        <div className="insights-header">
          <h3>📊 Chat Insights</h3>
        </div>
        <p>No insights data available</p>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h3>📊 Chat Insights</h3>
        <div className="insights-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          {roomId && (
            <select 
              value={viewType} 
              onChange={(e) => setViewType(e.target.value)}
              className="view-type-select"
            >
              <option value="global">Global View</option>
              <option value="channel">Channel View</option>
            </select>
          )}
          
          <button onClick={loadInsights} className="refresh-btn">
            🔄
          </button>
        </div>
      </div>

      <div className="insights-content">
        {/* Message Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-number">{formatNumber(insights.totalMessages || insights.messageStats?.totalMessages || 0)}</div>
              <div className="stat-label">Total Messages</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-number">{insights.averagePerDay || insights.messageStats?.averagePerDay || 0}</div>
              <div className="stat-label">Avg/Day</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{insights.uniqueUsers || insights.topContributors?.length || 0}</div>
              <div className="stat-label">Active Users</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-number">{formatHour(insights.messageStats?.peakHour || 12)}</div>
              <div className="stat-label">Peak Hour</div>
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        {(insights.topContributors || insights.topUsers) && (
          <div className="insights-section">
            <h4>🏆 Top Contributors</h4>
            <div className="contributors-list">
              {(insights.topContributors || insights.topUsers || []).map((user, index) => (
                <div key={index} className="contributor-item">
                  <div className="contributor-rank">#{index + 1}</div>
                  <div className="contributor-info">
                    <div className="contributor-name">{user.username}</div>
                    <div className="contributor-stats">
                      {user.messageCount || user.count} messages
                      {user.channelCount && ` • ${user.channelCount} channels`}
                    </div>
                  </div>
                  <div className="contributor-bar">
                    <div 
                      className="contributor-progress" 
                      style={{ 
                        width: `${((user.messageCount || user.count) / ((insights.topContributors || insights.topUsers)[0].messageCount || (insights.topContributors || insights.topUsers)[0].count)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Channels */}
        {insights.popularChannels && insights.popularChannels.length > 0 && (
          <div className="insights-section">
            <h4>🔥 Popular Channels</h4>
            <div className="channels-list">
              {insights.popularChannels.map((channel, index) => (
                <div key={index} className="channel-item">
                  <div className="channel-info">
                    <div className="channel-name">#{channel.name}</div>
                    <div className="channel-stats">
                      {channel.messageCount} messages • {channel.uniqueUsers} users
                    </div>
                  </div>
                  <div className="channel-activity">
                    {channel.lastActivity && (
                      <div className="last-activity">
                        {new Date(channel.lastActivity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Types (for channel view) */}
        {insights.messageTypes && (
          <div className="insights-section">
            <h4>📝 Message Types</h4>
            <div className="message-types">
              <div className="type-item">
                <span className="type-icon">💬</span>
                <span className="type-label">Text</span>
                <span className="type-count">{insights.messageTypes.text}</span>
              </div>
              <div className="type-item">
                <span className="type-icon">📎</span>
                <span className="type-label">Files</span>
                <span className="type-count">{insights.messageTypes.files}</span>
              </div>
              <div className="type-item">
                <span className="type-icon">😊</span>
                <span className="type-label">Reactions</span>
                <span className="type-count">{insights.messageTypes.reactions}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline (for channel view) */}
        {insights.timeline && insights.timeline.length > 0 && (
          <div className="insights-section">
            <h4>📅 Activity Timeline</h4>
            <div className="timeline-chart">
              {insights.timeline.map((day, index) => (
                <div key={index} className="timeline-day">
                  <div 
                    className="timeline-bar" 
                    style={{ 
                      height: `${(day.count / Math.max(...insights.timeline.map(d => d.count))) * 100}%` 
                    }}
                    title={`${new Date(day.date).toLocaleDateString()}: ${day.count} messages`}
                  ></div>
                  <div className="timeline-label">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
