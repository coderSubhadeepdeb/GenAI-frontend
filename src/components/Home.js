import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#4ecdc4',
        color: 'white',
        padding: '1rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '1.5rem' }}>🎨 Artisan Marketplace</h1>
          </div>
          <nav>
            {currentUser ? (
              <Link 
                to="/dashboard" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                Dashboard
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link 
                  to="/login" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  style={{ 
                    color: '#4ecdc4',
                    backgroundColor: 'white',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '3rem', 
            color: '#333', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            AI-Powered Marketplace Assistant
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#666', 
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Empowering local artisans to reach global markets through AI-enhanced storytelling, 
            market insights, and digital tools.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem', 
          marginBottom: '3rem' 
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#4ecdc4', marginBottom: '1rem' }}>📝 AI Story Generation</h3>
            <p style={{ color: '#666' }}>
              Transform your craft into compelling stories that connect with global customers 
              using advanced AI technology.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#4ecdc4', marginBottom: '1rem' }}>🖼️ Image Analysis</h3>
            <p style={{ color: '#666' }}>
              Get AI-powered insights about your product images and optimize them 
              for better market appeal.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#4ecdc4', marginBottom: '1rem' }}>📊 Market Insights</h3>
            <p style={{ color: '#666' }}>
              Access real-time market trends, pricing guidance, and customer 
              preferences for your craft category.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginTop: '3rem'
        }}>
          <h3 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.8rem' }}>
            Ready to Transform Your Craft Business? 🚀
          </h3>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Join thousands of artisans who are already using AI to reach global markets
          </p>
          
          {!currentUser && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link 
                to="/signup"
                style={{
                  backgroundColor: '#4ecdc4',
                  color: 'white',
                  padding: '0.75rem 2rem',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                Get Started Free
              </Link>
              <Link 
                to="/login"
                style={{
                  backgroundColor: 'transparent',
                  color: '#4ecdc4',
                  border: '2px solid #4ecdc4',
                  padding: '0.75rem 2rem',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Backend Status */}
        <div style={{
          backgroundColor: '#e8f8f6',
          border: '1px solid #4ecdc4',
          padding: '1rem',
          borderRadius: '6px',
          marginTop: '2rem',
          textAlign: 'left'
        }}>
          <h4 style={{ color: '#4ecdc4', margin: '0 0 0.5rem 0' }}>🌐 System Status</h4>
          <p style={{ margin: '0', color: '#333' }}>
            ✅ <strong>Backend:</strong> Connected to Google Cloud Run<br/>
            ✅ <strong>Database:</strong> Firestore operational<br/>
            ✅ <strong>AI Services:</strong> Ready for story generation & analysis
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
