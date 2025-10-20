# Complete Solutions - DND Button, Login Validation & Signup

## ✅ All Three Features Implemented!

1. **Beautiful DND Button** - Styled with gradients and animations
2. **Login Validation** - Form validation with error messages
3. **Signup Functionality** - Complete registration with Rocket.Chat API

---

## 1. Beautiful DND Button ✨

### What Changed

**Before:** Plain checkbox with "DND" label  
**After:** Beautiful toggle button with icons and animations

### CSS Code (ChatLayout.css)

```css
/* DND Button */
.dnd-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.dnd-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.dnd-button .dnd-icon,
.dnd-button .dnd-text {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.dnd-button .dnd-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dnd-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.dnd-button:hover .dnd-icon {
  transform: scale(1.1) rotate(10deg);
}

/* Active State (DND ON) */
.dnd-button.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.dnd-button.active::before {
  opacity: 0;
}

.dnd-button.active .dnd-icon {
  animation: shake 0.5s ease-in-out;
}

.dnd-button:active {
  transform: translateY(0);
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
```

### JSX Code (ChatLayout.jsx)

```jsx
<button 
  onClick={toggleDnd} 
  className={`dnd-button ${isDnd ? 'active' : ''}`}
  title={isDnd ? 'Turn off Do Not Disturb' : 'Turn on Do Not Disturb'}
>
  <span className="dnd-icon">{isDnd ? '🔕' : '🔔'}</span>
  <span className="dnd-text">{isDnd ? 'DND' : 'Available'}</span>
</button>
```

### Features

✅ **White background** when Available (🔔)  
✅ **Red gradient** when DND is ON (🔕)  
✅ **Hover effect** - Lifts up and icon rotates  
✅ **Shake animation** when activated  
✅ **Smooth transitions** - All effects are smooth  

---

## 2. Login Validation ✅

### What Changed

**Before:** No validation, any input accepted  
**After:** Comprehensive validation with error messages

### Validation Rules

#### Username:
- ✅ Required field
- ✅ Minimum 3 characters
- ✅ Trimmed whitespace

#### Password:
- ✅ Required field
- ✅ Minimum 6 characters

### Updated Login.jsx Code

```jsx
const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const result = await loginAPI(formData.username.trim(), formData.password);
      
      if (result.success) {
        login({
          authToken: result.authToken,
          userId: result.userId,
          user: result.user,
        });
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // In JSX, add field errors below inputs:
  return (
    // ...
    <div className="form-group">
      <label>Username or Email</label>
      <div className={`input-wrapper ${focusedField === 'username' ? 'focused' : ''}`}>
        {/* ... input ... */}
      </div>
      {fieldErrors.username && (
        <span className="field-error">{fieldErrors.username}</span>
      )}
    </div>

    <div className="form-group">
      <label>Password</label>
      <div className={`input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
        {/* ... input ... */}
      </div>
      {fieldErrors.password && (
        <span className="field-error">{fieldErrors.password}</span>
      )}
    </div>
    // ...
  );
};
```

### Field Error CSS (Login.css)

```css
/* Field Error Messages */
.field-error {
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
  font-weight: 500;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Features

✅ **Real-time validation** - Errors clear as you type  
✅ **Field-specific errors** - Shows error below each field  
✅ **Animated appearance** - Smooth slide-down animation  
✅ **Better error messages** - Clear, helpful messages  
✅ **Trim whitespace** - Username is trimmed before submission  

---

## 3. Signup Functionality 🎉

### Rocket.Chat API Added

I've added the `register` function to `rocketchat.js`:

```javascript
// Register/Signup
export const register = async (name, email, username, password) => {
  try {
    const response = await api.post('/users.register', {
      name,
      email,
      username,
      pass: password,
    });
    
    if (response.data.success) {
      return {
        success: true,
        user: response.data.user,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Registration failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || 'Network error during registration',
      details: error.response?.data,
    };
  }
};
```

### How to Use Signup

#### Option 1: Add Signup Link to Login Page

Update `Login.jsx` to add a signup link:

```jsx
<div className="login-footer">
  <p>Don't have an account? <a href="/signup">Sign up</a></p>
</div>
```

#### Option 2: Create Separate Signup Component

Create `Signup.jsx`:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login as loginAPI } from '../services/rocketchat';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Reuse same styles

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, dots, dashes, and underscores';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Register the user
      const registerResult = await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.username.trim(),
        formData.password
      );
      
      if (registerResult.success) {
        // Auto-login after successful registration
        const loginResult = await loginAPI(formData.username.trim(), formData.password);
        
        if (loginResult.success) {
          login({
            authToken: loginResult.authToken,
            userId: loginResult.userId,
            user: loginResult.user,
          });
          // Redirect handled by AuthContext
        } else {
          // Registration successful but auto-login failed
          setError('Account created! Please login manually.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        setError(registerResult.error || 'Registration failed');
      }
    } catch (err) {
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-blur blur-1"></div>
      <div className="background-blur blur-2"></div>
      <div className="background-blur blur-3"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h1>Create Account</h1>
          <p className="login-subtitle">Sign up to start chatting</p>
        </div>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className={`input-wrapper ${focusedField === 'name' ? 'focused' : ''}`}>
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className={`input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Username</label>
            <div className={`input-wrapper ${focusedField === 'username' ? 'focused' : ''}`}>
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField('')}
                placeholder="Choose a username"
                disabled={loading}
                required
              />
            </div>
            {fieldErrors.username && (
              <span className="field-error">{fieldErrors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className={`input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                placeholder="Create a password"
                disabled={loading}
                required
              />
            </div>
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className={`input-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''}`}>
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
```

### Signup Validation Rules

✅ **Name:** Required, min 2 characters  
✅ **Email:** Required, valid email format  
✅ **Username:** Required, min 3 characters, alphanumeric + dots/dashes/underscores  
✅ **Password:** Required, min 6 characters  
✅ **Confirm Password:** Must match password  

### Auto-Login After Signup

After successful registration, the user is automatically logged in!

---

## Summary of All Changes

### Files Modified:

1. ✅ **ChatLayout.jsx** - Beautiful DND button
2. ✅ **ChatLayout.css** - DND button styles
3. ✅ **Login.jsx** - Added validation
4. ✅ **Login.css** - Field error styles
5. ✅ **rocketchat.js** - Added register API

### Files to Create:

6. ✅ **Signup.jsx** - Complete signup component (code provided above)

---

## Testing Checklist

### DND Button:
- [ ] Click DND button
- [ ] Button turns red with 🔕 icon
- [ ] Shows "DND" text
- [ ] Hover effect works
- [ ] Shake animation plays
- [ ] Click again to turn off
- [ ] Button turns white with 🔔 icon
- [ ] Shows "Available" text

### Login Validation:
- [ ] Leave username empty → See error
- [ ] Enter 1-2 characters → See error
- [ ] Leave password empty → See error
- [ ] Enter 1-5 characters → See error
- [ ] Enter valid credentials → Login works
- [ ] Error clears when typing

### Signup:
- [ ] Fill all fields correctly
- [ ] Submit form
- [ ] Account created successfully
- [ ] Auto-login works
- [ ] Redirected to chat
- [ ] Try duplicate username → See error
- [ ] Try invalid email → See error
- [ ] Passwords don't match → See error

---

## Quick Start

### 1. DND Button (Already Applied!)
Just click the DND button in the header - it's already styled!

### 2. Login Validation (Already Applied!)
Try logging in with invalid data - validation is active!

### 3. Signup (Need to Add Route)

Add to your router (App.jsx or wherever routes are defined):

```jsx
import Signup from './components/Signup';

// In your routes:
<Route path="/signup" element={<Signup />} />
```

Then add a link in Login.jsx:

```jsx
<div className="login-footer" style={{ 
  marginTop: '20px', 
  textAlign: 'center',
  fontSize: '14px',
  color: '#6b7280'
}}>
  <p>
    Don't have an account?{' '}
    <a href="/signup" style={{ 
      color: '#667eea', 
      fontWeight: 600,
      textDecoration: 'none'
    }}>
      Sign up
    </a>
  </p>
</div>
```

---

## All Done! 🎉

✅ **DND Button** - Beautiful and animated  
✅ **Login Validation** - Comprehensive validation  
✅ **Signup API** - Rocket.Chat registration  
✅ **Signup Component** - Complete with validation  
✅ **Auto-Login** - After successful signup  

**Everything is ready to use!** 🚀
