import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// InitialsAvatar component (inline for simplicity)
const InitialsAvatar = ({ 
  name, 
  size = 40, 
  fontSize = 16,
  imageUrl = null,
  style = {}
}) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(part => part.length > 0);
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    } else if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return 'U';
  };

  const getAvatarColor = (name) => {
    if (!name) return '#4ecdc4';
    const colors = [
      '#4ecdc4', '#45b7d1', '#96c93d', '#f5a623',
      '#e85d75', '#7b68ee', '#ff6b6b', '#26de81',
      '#fd79a8', '#fdcb6e', '#6c5ce7', '#a29bfe'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(name);

  if (imageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #e9ecef',
          ...style
        }}
      >
        <img
          src={imageUrl}
          alt={name || 'User'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div
          style={{
            display: 'none',
            width: '100%',
            height: '100%',
            backgroundColor,
            color: 'white',
            fontSize: fontSize,
            fontWeight: 'bold',
            alignItems: 'center',
            justifyContent: 'center',
            textTransform: 'uppercase'
          }}
        >
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        ...style
      }}
    >
      {initials}
    </div>
  );
};

const UserSearch = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  const { searchUsers, followUser, unfollowUser, isFollowing } = useAuth();

  // Real-time search with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(searchTerm, searchCategory);
        const filteredResults = users.filter(user => user.id !== currentUser?.uid);
        setFilteredUsers(filteredResults);
        
        // Check follow status for each user
        const statusPromises = filteredResults.map(async (user) => {
          const following = await isFollowing(user.id);
          return { [user.id]: following };
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, status) => ({ ...acc, ...status }), {});
        setFollowingStatus(statusMap);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredUsers([]);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchCategory, currentUser, searchUsers, isFollowing]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleFollow = async (userId) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const isCurrentlyFollowing = followingStatus[userId];
      
      if (isCurrentlyFollowing) {
        const result = await unfollowUser(userId);
        if (result.success) {
          setFollowingStatus(prev => ({ ...prev, [userId]: false }));
          setFilteredUsers(prev => 
            prev.map(user => 
              user.id === userId 
                ? { ...user, followers: (user.followers || 0) - 1 }
                : user
            )
          );
        } else {
          alert('❌ Error unfollowing user: ' + result.error);
        }
      } else {
        const result = await followUser(userId);
        if (result.success) {
          setFollowingStatus(prev => ({ ...prev, [userId]: true }));
          setFilteredUsers(prev => 
            prev.map(user => 
              user.id === userId 
                ? { ...user, followers: (user.followers || 0) + 1 }
                : user
            )
          );
        } else {
          alert('❌ Error following user: ' + result.error);
        }
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
    
    setFollowLoading(prev => ({ ...prev, [userId]: false }));
  };

  const handleMessage = (userId) => {
    alert('💬 Messaging functionality will be implemented in the next update!');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '1.8rem' }}>
          🔍 Find Fellow Artisans
        </h2>
        <div style={{
          backgroundColor: loading ? '#f8f9fa' : '#e8f8f6',
          color: loading ? '#666' : '#4ecdc4',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          {loading ? 'Searching...' : `${filteredUsers.length} artisans found`}
        </div>
      </div>

      {/* Search Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search by name, craft, location, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4ecdc4'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
        </div>
        
        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            minWidth: '150px'
          }}
        >
          <option value="all">All Crafts</option>
          <option value="Pottery">Pottery</option>
          <option value="Woodworking">Woodworking</option>
          <option value="Jewelry Making">Jewelry</option>
          <option value="Textile Arts">Textiles</option>
          <option value="Metalwork">Metalwork</option>
          <option value="Painting">Painting</option>
          <option value="Sculpture">Sculpture</option>
        </select>

        <button
          onClick={() => {
            setSearchTerm('');
            setSearchCategory('all');
          }}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Clear
        </button>
      </div>

      {/* Search Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Searching for artisans...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredUsers.map(user => {
            const isUserFollowing = followingStatus[user.id];
            const isFollowLoading = followLoading[user.id];
            
            return (
              <div
                key={user.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => handleUserClick(user)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                }}
              >
                {/* User Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <InitialsAvatar
                    name={user.displayName || 'Anonymous Artisan'}
                    imageUrl={user.profileImage}
                    size={60}
                    fontSize={20}
                    style={{ marginRight: '1rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {user.displayName || 'Anonymous Artisan'}
                      </h3>
                      {user.verified && (
                        <span style={{ color: '#4ecdc4', fontSize: '1.2rem' }} title="Verified Artist">
                          ✓
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      @{user.username}
                    </div>
                    <div style={{
                      backgroundColor: '#e8f8f6',
                      color: '#4ecdc4',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      🎨 {user.craftType || 'Artisan'}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <p style={{ 
                  color: '#666', 
                  fontSize: '0.9rem', 
                  lineHeight: '1.4',
                  margin: '0 0 1rem 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {user.bio || 'No bio available'}
                </p>

                {/* Location & Experience */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.8rem',
                  color: '#666',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {user.location && <span>📍 {user.location}</span>}
                  {user.experience && <span>⏰ {user.experience}</span>}
                  <span>👥 {user.followers || 0} followers</span>
                </div>

                {/* Skills */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                  marginBottom: '1rem'
                }}>
                  {user.skills?.slice(0, 3).map(skill => (
                    <span
                      key={skill}
                      style={{
                        backgroundColor: '#f8f9fa',
                        color: '#666',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {user.skills?.length > 3 && (
                    <span style={{
                      color: '#666',
                      fontSize: '0.8rem',
                      padding: '0.2rem 0.5rem'
                    }}>
                      +{user.skills.length - 3} more
                    </span>
                  )}
                </div>

                {/* Stats & Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#666' }}>
                    <span>{user.postsCount || 0} posts</span>
                    <span>Joined {new Date(user.createdAt?.toDate?.()).getFullYear() || '2025'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(user.id);
                      }}
                      disabled={isFollowLoading}
                      style={{
                        backgroundColor: isUserFollowing ? '#6c757d' : '#4ecdc4',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        cursor: isFollowLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        opacity: isFollowLoading ? 0.7 : 1
                      }}
                    >
                      {isFollowLoading ? (
                        '⏳'
                      ) : isUserFollowing ? (
                        '✓ Following'
                      ) : (
                        '+ Follow'
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessage(user.id);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#4ecdc4',
                        border: '1px solid #4ecdc4',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      💬
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredUsers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No artisans found</h3>
          <p style={{ margin: 0 }}>
            {searchTerm ? 
              `No results for "${searchTerm}". Try different keywords or browse all artisans.` :
              'Start typing to search for artisans by name, craft type, or skills.'
            }
          </p>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <InitialsAvatar
                name={selectedUser.displayName || 'Anonymous Artisan'}
                imageUrl={selectedUser.profileImage}
                size={100}
                fontSize={32}
                style={{ marginBottom: '1rem' }}
              />
              <h2 style={{ margin: '0 0 0.5rem 0' }}>
                {selectedUser.displayName || 'Anonymous Artisan'}
              </h2>
              <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
                @{selectedUser.username}
              </p>
              <div style={{
                backgroundColor: '#e8f8f6',
                color: '#4ecdc4',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                🎨 {selectedUser.craftType || 'Artisan'}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ textAlign: 'center', color: '#666', lineHeight: '1.5' }}>
                {selectedUser.bio || 'No bio available'}
              </p>
              {selectedUser.aboutMe && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>About</h4>
                  <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.9rem' }}>
                    {selectedUser.aboutMe}
                  </p>
                </div>
              )}
            </div>

            {selectedUser.skills && selectedUser.skills.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4ecdc4', marginBottom: '1rem' }}>Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedUser.skills.map(skill => (
                    <span
                      key={skill}
                      style={{
                        backgroundColor: '#4ecdc4',
                        color: 'white',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  handleFollow(selectedUser.id);
                  setShowUserProfile(false);
                }}
                disabled={followLoading[selectedUser.id]}
                style={{
                  flex: 1,
                  backgroundColor: followingStatus[selectedUser.id] ? '#6c757d' : '#4ecdc4',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  cursor: followLoading[selectedUser.id] ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: followLoading[selectedUser.id] ? 0.7 : 1
                }}
              >
                {followLoading[selectedUser.id] ? (
                  '⏳ Processing...'
                ) : followingStatus[selectedUser.id] ? (
                  '✓ Following'
                ) : (
                  '+ Follow'
                )}
              </button>
              <button
                onClick={() => setShowUserProfile(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
