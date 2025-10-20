# Thread Functionality Debugging Guide

## Changes Made

### 1. **Updated rocketchat.js**
- Fixed API parameter format (using `params` object instead of query string)
- Added comprehensive console logging for all thread operations
- Better error handling and error messages

### 2. **Added Error Handling to ThreadModal**
- Error state display in the UI
- Console logging for debugging
- Better error messages

## How to Test Thread Functionality

### Step 1: Check Browser Console
Open your browser's Developer Tools (F12) and go to the Console tab. You should see logs like:
- `[ThreadModal] Loading thread messages for: <messageId>`
- `[rocketchat] getThreadMessages error:` (if there's an error)
- `[rocketchat] postThreadMessage request:` (when sending a reply)

### Step 2: Test Starting a Thread
1. Go to any channel with messages
2. Hover over a message - you should see a 💬 button
3. Click the 💬 button
4. A modal should open showing the original message
5. Check the console for any errors

### Step 3: Test Sending a Reply
1. In the thread modal, type a message in the textarea
2. Press Enter or click "Send"
3. Check the console for:
   - `[ThreadModal] Sending reply to thread:`
   - `[rocketchat] postThreadMessage request:`
   - Success or error messages

## Common Issues and Solutions

### Issue 1: "Failed to get threads list" Error
**Possible Causes:**
- Rocket.Chat server doesn't support threads API
- API endpoint name is different in your Rocket.Chat version
- Authentication issue

**Solution:**
Check your Rocket.Chat version and API documentation. The thread endpoints might be:
- `/chat.getThreadsList` (current)
- `/v1/chat.getThreadsList` (alternative)
- Threads might not be enabled on your server

### Issue 2: Thread Modal Opens But Shows No Messages
**Possible Causes:**
- The message doesn't have any thread replies yet
- API returns empty array
- Message ID format issue

**Solution:**
1. Try replying to the thread first
2. Check console logs for the API response
3. Verify the message._id is correct

### Issue 3: Cannot Send Thread Reply
**Possible Causes:**
- Room ID is missing or incorrect
- Thread message ID (tmid) is wrong
- Permission issue

**Solution:**
Check console logs for:
```javascript
[rocketchat] postThreadMessage request: {
  roomId: "...",  // Should be present
  tmid: "...",    // Should match the original message ID
  message: "..."
}
```

### Issue 4: Rocket.Chat API Version Compatibility
If your Rocket.Chat server uses a different API version, you may need to update the endpoints in `rocketchat.js`:

```javascript
// Try these alternatives if current endpoints don't work:

// Option 1: Add /v1/ prefix
const response = await api.get(`/v1/chat.getThreadsList`, ...);

// Option 2: Use different endpoint names
const response = await api.get(`/threads.list`, ...);
const response = await api.get(`/threads.messages`, ...);
```

## Checking Rocket.Chat Server Support

To verify if your Rocket.Chat server supports threads:

1. **Check Rocket.Chat Version:**
   - Threads were added in Rocket.Chat 1.0+
   - Full thread support in 2.0+

2. **Test API Directly:**
   Open your browser console and run:
   ```javascript
   fetch('YOUR_ROCKETCHAT_URL/api/v1/chat.getThreadsList?rid=ROOM_ID', {
     headers: {
       'X-Auth-Token': 'YOUR_AUTH_TOKEN',
       'X-User-Id': 'YOUR_USER_ID'
     }
   }).then(r => r.json()).then(console.log);
   ```

3. **Check Server Settings:**
   - Go to Rocket.Chat Admin Panel
   - Navigate to Settings > Message
   - Ensure "Enable Threads" is turned ON

## Expected Console Output (Success)

When everything works correctly, you should see:
```
[ThreadModal] Loading thread messages for: abc123xyz
[rocketchat] getThreadMessages request with params: { tmid: "abc123xyz", count: 100, offset: 0 }
[ThreadModal] Loaded 3 thread messages

[ThreadModal] Sending reply to thread: abc123xyz
[rocketchat] postThreadMessage request: { roomId: "GENERAL", tmid: "abc123xyz", message: "Test reply" }
[rocketchat] postThreadMessage success: { ... }
[ThreadModal] Reply sent successfully
[ThreadModal] Loading thread messages for: abc123xyz
[ThreadModal] Loaded 4 thread messages
```

## Next Steps

1. **Open the browser console** and try clicking the thread button
2. **Copy any error messages** you see
3. **Check the network tab** in DevTools to see the actual API requests
4. **Verify your Rocket.Chat server version** and thread support

If you see specific errors, share them and we can fix the exact issue!
