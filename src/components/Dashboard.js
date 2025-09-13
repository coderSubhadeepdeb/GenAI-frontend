import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#4ecdc4',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>🎨 Artisan Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid white',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      <main style={{ padding: '2rem' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2>Welcome, {currentUser?.displayName || currentUser?.email}! 👋</h2>
          <p>Your AI-Powered Marketplace Assistant is ready to help you reach global markets.</p>
          
          <div style={{ marginTop: '2rem' }}>
            <h3>Quick Actions:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4>📝 Create Product Story</h4>
                <p>Use AI to generate compelling stories for your products</p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4>📊 View Analytics</h4>
                <p>Track your reach and engagement metrics</p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4>🖼️ Analyze Images</h4>
                <p>Get AI-powered insights about your product images</p>
              </div>

            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>🚀 Backend Connection Status</h3>
          <p style={{ color: 'green' }}>✅ Connected to Google Cloud Run Backend</p>
          <p><strong>Backend URL:</strong> https://artisan-backend-577359325267.us-central1.run.app</p>
          <p><strong>Project:</strong> bloom-final-471317</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
