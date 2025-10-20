import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchMessages } from '../services/rocketchat';
import './SearchView.css';

const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key) || '';

const SearchView = () => {
  const { authToken, userId } = useAuth();
  const [query, setQuery] = useState(getQueryParam('query'));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load search from URL on mount
  useEffect(() => {
    const urlQuery = getQueryParam('query');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    console.log('=== SEARCH START ===');
    console.log('Search query:', searchQuery.trim());
    console.log('Auth token:', authToken ? 'Present' : 'Missing');
    console.log('User ID:', userId);

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      console.log('Calling searchMessages API...');
      const result = await searchMessages(searchQuery.trim(), authToken, userId);
      
      console.log('=== SEARCH RESULT FROM BACKEND ===');
      console.log('Success:', result.success);
      console.log('Total results:', result.count);
      console.log('Messages array:', result.messages);
      console.log('Full result object:', result);
      
      if (result.success) {
        console.log('✅ Search successful!');
        console.log('Number of messages:', result.messages?.length || 0);
        
        if (result.messages && result.messages.length > 0) {
          console.log('First message sample:', result.messages[0]);
          console.log('Message has roomName?', !!result.messages[0].roomName);
        }
        
        setResults(result.messages || []);
        // Update URL with search query
        const url = new URL(window.location.href);
        url.searchParams.set('query', searchQuery.trim());
        window.history.pushState({}, '', url.toString());
      } else {
        console.log('❌ Search failed:', result.error);
        setError(result.error || 'Search failed');
        setResults([]);
      }
    } catch (err) {
      console.error('❌ Search error (exception):', err);
      setError('An error occurred while searching');
      setResults([]);
    } finally {
      setLoading(false);
      console.log('=== SEARCH END ===');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const copyShareable = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('query', query);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i}>{part}</mark> 
            : part
        )}
      </>
    );
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
    <div className="search-view">
      <div className="search-header">
        <h3>🔎 Search Messages</h3>
        <p className="search-subtitle">Search across all channels and messages</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for messages, users, or keywords..."
            className="search-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={loading || !query.trim()}
          >
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>

        <div className="search-actions">
          <button 
            type="button"
            onClick={copyShareable}
            className="share-button"
            disabled={!query.trim()}
          >
            {copied ? '✅ Copied!' : '🔗 Copy Shareable Link'}
          </button>
        </div>
      </form>

      {error && (
        <div className="search-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading && (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Searching messages...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="search-empty">
          <div className="empty-icon">🔍</div>
          <h4>No results found</h4>
          <p>Try different keywords or check your spelling</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h4>Found {results.length} {results.length === 1 ? 'result' : 'results'}</h4>
            <span className="results-query">for "{query}"</span>
          </div>

          <div className="results-list">
            {results.map((msg) => (
              <div key={msg._id} className="result-item">
                <div className="result-header">
                  <div className="result-user">
                    <span 
                      className="user-avatar"
                      style={{ background: getAvatarColor(msg.u?.name || msg.u?.username || '?') }}
                    >
                      {(msg.u?.name || msg.u?.username || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="user-info">
                      <span className="user-name">
                        {msg.u?.name || msg.u?.username || 'Unknown User'}
                      </span>
                      <span className="message-time">{formatDate(msg.ts)}</span>
                    </div>
                  </div>
                  {msg.rid && (
                    <span className="message-channel">
                      #{msg.roomName || msg.rid}
                    </span>
                  )}
                </div>

                <div className="result-content">
                  {highlightText(getMessageContent(msg), query)}
                </div>

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="result-attachments">
                    📎 {msg.attachments.length} {msg.attachments.length === 1 ? 'attachment' : 'attachments'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div className="search-welcome">
          <div className="welcome-icon">🔍</div>
          <h4>Search Messages</h4>
          <p>Enter keywords to search across all your channels</p>
          <div className="search-tips">
            <h5>💡 Search Tips:</h5>
            <ul>
              <li>Use specific keywords for better results</li>
              <li>Search by username to find messages from specific users</li>
              <li>Share search results with others using the shareable link</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchView;
