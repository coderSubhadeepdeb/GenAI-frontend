import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import InitialsAvatar from './common/InitialsAvatar';

const Home = () => {
  const { currentUser, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch posts for social feed
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setPosts(feedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // For non-authenticated users, show welcome page
  if (!currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8f9fa' 
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>Welcome to CraftAI Studio</h2>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Discover amazing artisan creations and join our creative community!
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link 
              to="/signup"
              style={{
                backgroundColor: '#4ecdc4',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Join Community
            </Link>
            <Link 
              to="/login"
              style={{
                backgroundColor: 'transparent',
                color: '#4ecdc4',
                border: '2px solid #4ecdc4',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e9ecef',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
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
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ margin: 0, color: '#4ecdc4', fontSize: '1.8rem', fontWeight: 'bold' }}>
              🎨 CraftAI Studio
            </h1>
            <div style={{
              backgroundColor: '#e8f8f6',
              color: '#4ecdc4',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              Community Feed
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              👋 {userProfile?.displayName || 'Artisan'}
            </span>
            <Link 
              to="/dashboard" 
              style={{ 
                backgroundColor: '#4ecdc4',
                color: 'white',
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              🚀 Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Social Feed */}
      <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              animation: 'spin 2s linear infinite'
            }}>
              🎨
            </div>
            <h3>Loading community feed...</h3>
            <p style={{ color: '#666' }}>Discovering amazing artisan creations</p>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
            <h3>No posts yet</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Be the first to share your amazing work with the community!
            </p>
            <Link 
              to="/dashboard"
              style={{
                backgroundColor: '#4ecdc4',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {posts.map((post) => (
              <article
                key={post.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Post Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <InitialsAvatar
                    name={post.authorName || 'Artist'}
                    imageUrl={post.authorAvatar}
                    size={45}
                    fontSize={18}
                    style={{ marginRight: '1rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {post.authorName || 'Anonymous Artist'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {formatTimeAgo(post.createdAt)} • {post.craftType || 'Artisan'}
                    </div>
                  </div>
                </div>

                {/* Post Image */}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    style={{
                      width: '100%',
                      maxHeight: '500px',
                      objectFit: 'cover'
                    }}
                  />
                )}

                {/* Post Content */}
                <div style={{ padding: '1.5rem' }}>
                  <h2 style={{ 
                    margin: '0 0 0.75rem 0', 
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {post.title}
                  </h2>
                  
                  {post.description && (
                    <p style={{ 
                      margin: '0 0 1rem 0', 
                      color: '#666', 
                      fontSize: '1rem',
                      lineHeight: '1.6'
                    }}>
                      {post.description}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            backgroundColor: '#e8f8f6',
                            color: '#4ecdc4',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '15px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>❤️ {post.likes || 0}</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>💬 {post.comments || 0}</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>📤 {post.shares || 0}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>
                      👀 {post.views || 0} views
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
