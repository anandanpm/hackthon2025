// Notification sound using Web Audio API
const createNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a pleasant notification sound (two-tone beep)
    const playSound = () => {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // First tone: 800Hz
      oscillator1.frequency.value = 800;
      oscillator1.type = 'sine';
      
      // Second tone: 1000Hz (harmony)
      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);
      oscillator2.stop(audioContext.currentTime + 0.3);
    };
    
    return playSound;
  } catch (error) {
    console.warn('[Notifications] Audio not supported:', error);
    return null;
  }
};

// Initialize sound
let playNotificationSound = createNotificationSound();

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return { supported: false, permission: 'denied' };
  let permission = Notification.permission;
  if (permission === 'default') {
    try { permission = await Notification.requestPermission(); } catch {}
  }
  return { supported: true, permission };
};

export const showNotification = ({ title, body, icon, tag } = {}) => {
  if (!('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  try {
    return new Notification(title || 'Notification', { body, icon, tag });
  } catch {
    return null;
  }
};

export const playSound = () => {
  if (playNotificationSound) {
    try {
      playNotificationSound();
    } catch (error) {
      console.warn('[Notifications] Failed to play sound:', error);
    }
  }
};

export const notifyIfAllowed = ({ isDnd, title, body, icon, tag, sound = true }) => {
  if (isDnd) return null;
  
  // Play sound if enabled
  if (sound) {
    playSound();
  }
  
  return showNotification({ title, body, icon, tag });
};
