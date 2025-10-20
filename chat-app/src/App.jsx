import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrefsProvider } from './contexts/PrefsContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatLayout from './components/ChatLayout';
import './App.css';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} 
      />
      <Route 
        path="/" 
        element={isAuthenticated ? <ChatLayout /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrefsProvider>
          <AppContent />
        </PrefsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
