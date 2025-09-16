import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import InitialsAvatar from './common/InitialsAvatar';

const Home = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slideshow
  useEffect(() => {
    if (posts.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % posts.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [posts.length]);

  // Fetch latest posts
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(15));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const latestPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setPosts(latestPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % posts.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + posts.length) % posts.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      {/* Floating Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        padding: '1rem 0'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.8rem', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              🎨 CraftAI Studio
            </h1>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              LIVE FEED
            </div>
          </div>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  👋 {currentUser.displayName || 'Creator'}
                </span>
                <Link 
                  to="/dashboard" 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  🚀 Dashboard
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link 
                  to="/login" 
                  style={{ 
                    color: '#667eea',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  Join Now
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Feed Container */}
      <main style={{ 
        paddingTop: '100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 2rem 2rem'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              animation: 'pulse 2s infinite'
            }}>
              🎨
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>
              Loading Amazing Creations...
            </h2>
            <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>
              Discovering the latest artisan masterpieces
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>
              Be the First Creator!
            </h2>
            <p style={{ opacity: 0.8, fontSize: '1.2rem', marginBottom: '2rem' }}>
              Start the community by sharing your amazing work
            </p>
            {!currentUser && (
              <Link 
                to="/signup"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid white',
                  padding: '1rem 2rem',
                  textDecoration: 'none',
                  borderRadius: '30px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(10px)'
                }}
              >
                🚀 Join & Create
              </Link>
            )}
          </div>
        ) : (
          <div style={{ 
            maxWidth: '500px', 
            width: '100%',
            position: 'relative'
          }}>
            {/* Story-Style Slideshow */}
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              background: 'white',
              aspectRatio: '9/16',
              maxHeight: '80vh'
            }}>
              {/* Post Image/Content */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '70%',
                background: posts[currentSlide]?.imageUrl 
                  ? `url(${posts[currentSlide].imageUrl})` 
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end'
              }}>
                {/* Progress Bars */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '15px',
                  right: '15px',
                  display: 'flex',
                  gap: '4px',
                  zIndex: 10
                }}>
                  {posts.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: '3px',
                        borderRadius: '2px',
                        background: index === currentSlide 
                          ? 'white' 
                          : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer'
                      }}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  style={{
                    position: 'absolute',
                    left: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  ←
                </button>
                <button
                  onClick={nextSlide}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  →
                </button>

                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  zIndex: 1
                }}></div>
              </div>

              {/* Post Info */}
              <div style={{ 
                padding: '20px',
                height: '30%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <InitialsAvatar
                    name={posts[currentSlide]?.authorName || 'Artist'}
                    imageUrl={posts[currentSlide]?.authorAvatar}
                    size={45}
                    fontSize={18}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {posts[currentSlide]?.authorName || 'Anonymous Artist'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {formatTimeAgo(posts[currentSlide]?.createdAt)} • {posts[currentSlide]?.craftType || 'Artisan'}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#999' }}>
                    {currentSlide + 1} / {posts.length}
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#333',
                    lineHeight: '1.3'
                  }}>
                    {posts[currentSlide]?.title}
                  </h3>
                  
                  {posts[currentSlide]?.description && (
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      color: '#666', 
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {posts[currentSlide].description}
                    </p>
                  )}

                  {/* Tags */}
                  {posts[currentSlide]?.tags && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {posts[currentSlide].tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: '#999',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>❤️ {posts[currentSlide]?.likes || 0}</span>
                    <span>💬 {posts[currentSlide]?.comments || 0}</span>
                    <span>📤 {posts[currentSlide]?.shares || 0}</span>
                  </div>
                  <span>👀 {posts[currentSlide]?.views || 0}</span>
                </div>
              </div>
            </div>

            {/* Dots Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px'
            }}>
              {posts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentSlide 
                      ? 'white' 
                      : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Home;
