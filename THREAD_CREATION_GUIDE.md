# Thread Creation - Complete Guide & Best Practices

## Current Problem

1. **Users can create threads on their own messages** - This is weird and not standard
2. **Thread button always visible** - Should only show on other people's messages
3. **No clear indication** - Users don't know how to create threads properly

---

## How Threads Work in Rocket.Chat

### Standard Thread Behavior:

1. **Someone posts a message** in a channel
2. **Others can reply** to that message in a thread
3. **Thread creator** is the person who sent the original message
4. **Thread participants** are people who reply

### Key Points:
- ✅ Threads are created automatically when you reply to a message
- ✅ You DON'T manually "create" a thread - you reply to a message
- ✅ The original message becomes the thread parent
- ❌ You shouldn't create threads on your own messages (weird!)

---

## Correct Thread Flow

### Step 1: User A Posts a Message
```
User A: "What time is the meeting?"
```

### Step 2: User B Clicks Thread Button
```
User B clicks 💬 on User A's message
→ Thread modal opens
```

### Step 3: User B Replies in Thread
```
Thread:
  Original: "What time is the meeting?" (User A)
  Reply 1: "It's at 3 PM" (User B)
```

### Step 4: Others Can Join
```
Thread:
  Original: "What time is the meeting?" (User A)
  Reply 1: "It's at 3 PM" (User B)
  Reply 2: "Thanks!" (User C)
```

---

## Solution: Prevent Self-Threading

### Updated Message.jsx

```jsx
import React, { useState } from 'react';
import './Message.css';
import { useAuth } from '../contexts/AuthContext';
import { pinMessage, unpinMessage } from '../services/rocketchat';

const Message = ({ message, isOwn, onStartThread }) => {
  const { authToken, userId } = useAuth();
  const [pinBusy, setPinBusy] = useState(false);
  const [pinned, setPinned] = useState(!!message.pinned);

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

  const handleStartThread = () => {
    if (onStartThread && message._id) {
      console.log('[Message] Starting thread for message:', message._id, message);
      onStartThread(message);
    } else {
      console.warn('[Message] Cannot start thread:', { 
        onStartThread: !!onStartThread, 
        messageId: message._id 
      });
    }
  };

  const threadCount = message.tcount || message.replies?.length || 0;
  
  // Check if user is the message author
  const isMessageAuthor = message.u?._id === userId;

  return (
    <div className={`message-container ${isOwn ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="sender-name">
            {message.u?.name || message.u?.username || 'Unknown User'}
          </span>
          <span className="message-time">
            {formatTime(message.ts)}
          </span>
          <div className="message-actions">
            <button
              className={`message-pin-btn ${pinned ? 'active' : ''}`}
              title={pinned ? 'Unpin message' : 'Pin message'}
              onClick={onTogglePin}
              disabled={pinBusy}
            >
              📌
            </button>
            
            {/* Only show thread button if:
                1. Not your own message (prevent self-threading)
                2. OR thread already exists (can view existing thread)
            */}
            {(!isMessageAuthor || threadCount > 0) && (
              <button
                className="message-thread-btn"
                title={
                  threadCount > 0 
                    ? "View thread" 
                    : "Reply in thread"
                }
                onClick={handleStartThread}
              >
                💬
              </button>
            )}
          </div>
        </div>
        
        <div className="message-content">
          {message.msg || message.message || message.text || '(No message content)'}
        </div>
        
        {/* Show thread info if thread exists */}
        {threadCount > 0 && (
          <div className="message-thread-info" onClick={handleStartThread}>
            💬 {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
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
    </div>
  );
};

export default Message;
```

---

## Key Changes

### 1. Check Message Authorship
```jsx
const isMessageAuthor = message.u?._id === userId;
```

### 2. Conditional Thread Button
```jsx
{(!isMessageAuthor || threadCount > 0) && (
  <button className="message-thread-btn">
    💬
  </button>
)}
```

**Logic:**
- ❌ Hide thread button on your own messages (unless thread exists)
- ✅ Show thread button on other people's messages
- ✅ Show thread button if thread already has replies (to view them)

### 3. Better Tooltip
```jsx
title={
  threadCount > 0 
    ? "View thread" 
    : "Reply in thread"
}
```

---

## User Experience Flow

### Scenario 1: Your Own Message
```
You: "Hello everyone!"
[📌] (pin button only - no thread button)
```
**Why?** You can't reply to yourself in a thread. That's weird!

### Scenario 2: Someone Else's Message
```
John: "What's the deadline?"
[📌] [💬] (both buttons visible)
```
**Why?** You can reply to John's message in a thread.

### Scenario 3: Your Message with Existing Thread
```
You: "Hello everyone!"
💬 3 replies
[📌] [💬] (thread button appears because thread exists)
```
**Why?** You can view the thread others created on your message.

---

## Alternative Approaches

### Option 1: Allow Self-Threading (Not Recommended)
```jsx
// Always show thread button
<button className="message-thread-btn">💬</button>
```
**Pros:** Simple, no restrictions  
**Cons:** Weird UX, users can reply to themselves

### Option 2: Hide Thread Button on Own Messages (Recommended)
```jsx
// Only show on other's messages
{!isMessageAuthor && (
  <button className="message-thread-btn">💬</button>
)}
```
**Pros:** Clean UX, prevents self-threading  
**Cons:** Can't view threads on your own messages

### Option 3: Smart Display (Best - Implemented Above)
```jsx
// Show if not author OR thread exists
{(!isMessageAuthor || threadCount > 0) && (
  <button className="message-thread-btn">💬</button>
)}
```
**Pros:** Best of both worlds  
**Cons:** Slightly more complex logic

---

## Thread Creation Methods

### Method 1: Click Thread Button (Current)
1. Click 💬 on someone's message
2. Thread modal opens
3. Type reply and send
4. Thread is created

### Method 2: Hover Menu (Alternative)
```jsx
<div className="message-hover-menu">
  <button onClick={handleReply}>Reply in thread</button>
  <button onClick={handlePin}>Pin</button>
  <button onClick={handleReact}>React</button>
</div>
```

### Method 3: Right-Click Context Menu (Advanced)
```jsx
<ContextMenu>
  <MenuItem onClick={handleReply}>Reply in thread</MenuItem>
  <MenuItem onClick={handlePin}>Pin message</MenuItem>
  <MenuItem onClick={handleQuote}>Quote</MenuItem>
</ContextMenu>
```

### Method 4: Keyboard Shortcut (Power Users)
```jsx
// Press 'R' to reply in thread
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'r' && !e.ctrlKey) {
      handleStartThread();
    }
  };
  window.addEventListener('keypress', handleKeyPress);
  return () => window.removeEventListener('keypress', handleKeyPress);
}, []);
```

---

## Best Practices

### ✅ DO:
- Show thread button on other people's messages
- Show thread count when threads exist
- Allow viewing threads on your own messages (if they exist)
- Use clear tooltips ("Reply in thread" vs "View thread")
- Highlight messages with active threads

### ❌ DON'T:
- Allow creating threads on your own messages
- Hide thread button completely on own messages (if thread exists)
- Make thread creation confusing
- Allow multiple thread buttons
- Forget to show thread count

---

## Visual Indicators

### Message Without Thread (Other's Message)
```
┌─────────────────────────────────────┐
│ John Doe              2:30 PM       │
│ What time is the meeting?           │
│                            [📌] [💬] │
└─────────────────────────────────────┘
```

### Message Without Thread (Your Message)
```
┌─────────────────────────────────────┐
│ You                   2:31 PM       │
│ It's at 3 PM                        │
│                            [📌]     │ ← No thread button
└─────────────────────────────────────┘
```

### Message With Thread (Your Message)
```
┌─────────────────────────────────────┐
│ You                   2:31 PM       │
│ It's at 3 PM                        │
│ 💬 2 replies                        │ ← Thread indicator
│                            [📌] [💬] │ ← Can view thread
└─────────────────────────────────────┘
```

---

## Summary

### Current Behavior:
- ❌ Thread button shows on all messages
- ❌ Users can create threads on their own messages
- ❌ Confusing UX

### New Behavior:
- ✅ Thread button only on other's messages
- ✅ Can view threads on own messages (if they exist)
- ✅ Clear tooltips and indicators
- ✅ Better UX

### Implementation:
```jsx
const isMessageAuthor = message.u?._id === userId;

{(!isMessageAuthor || threadCount > 0) && (
  <button 
    className="message-thread-btn"
    title={threadCount > 0 ? "View thread" : "Reply in thread"}
  >
    💬
  </button>
)}
```

**This prevents weird self-threading while allowing users to view threads on their messages!** 🎉
