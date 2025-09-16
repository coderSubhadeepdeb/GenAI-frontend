import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit , deleteDoc, doc} from 'firebase/firestore';
import { db } from '../../config/firebase';
import InitialsAvatar from '../common/InitialsAvatar';

const UserProfile = ({ profileData, currentUser, onProfileUpdate, onImageUpload }) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profileData?.username || '');
  const [message, setMessage] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  
  const { updateUsername, uploadImage } = useAuth();

  // Add this function before the return statement in UserProfile.js
const handleDeletePost = async (postId, postTitle) => {
  const confirmMessage = `Are you sure you want to delete "${postTitle}"?\n\nThis action cannot be undone.`;
  
  if (!window.confirm(confirmMessage)) {
    return;
  }

  try {
    console.log('🗑️ Deleting post:', postId);
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'posts', postId));
    
    // Update local state immediately for better UX
    setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    
    console.log('✅ Post deleted successfully');
    setMessage('✅ Post deleted successfully!');
    setTimeout(() => setMessage(''), 3000);
    
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    setMessage('❌ Error deleting post: ' + error.message);
  }
};


  const [tempData, setTempData] = useState({
    displayName: profileData?.displayName || '',
    bio: profileData?.bio || '',
    aboutMe: profileData?.aboutMe || '',
    location: profileData?.location || '',
    craftType: profileData?.craftType || '',
    experience: profileData?.experience || '',
    skills: profileData?.skills || [],
    contact: {
      phone: profileData?.contact?.phone || '',
      website: profileData?.contact?.website || '',
      social: {
        instagram: profileData?.contact?.social?.instagram || '',
        facebook: profileData?.contact?.social?.facebook || '',
        twitter: profileData?.contact?.social?.twitter || ''
      }
    }
  });

  const skillsList = [
    'Pottery', 'Jewelry Making', 'Textile Arts', 'Woodworking', 'Metalwork',
    'Painting', 'Sculpture', 'Glasswork', 'Leather Craft', 'Ceramics',
    'Embroidery', 'Weaving', 'Carving', 'Beadwork', 'Calligraphy'
  ];

  const experienceLevels = [
    'Beginner', '1-2 years', '3-5 years', '6-10 years', '10+ years', 'Master Craftsperson'
  ];

  // Fetch user posts in real-time
  useEffect(() => {
    if (!currentUser?.uid) {
      setPostsLoading(false);
      return;
    }

    console.log('📡 Setting up user posts listener for:', currentUser.uid);
    
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log(`📬 Found ${snapshot.docs.length} posts for user`);
          
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));

          setUserPosts(posts);
          setPostsLoading(false);
          setPostsError('');
          
          console.log('✅ User posts loaded:', posts);
        },
        (error) => {
          console.error('❌ Error loading user posts:', error);
          
          if (error.code === 'failed-precondition' && error.message.includes('index')) {
            setPostsError('⏳ Index is still building. Your posts will appear shortly...');
          } else {
            setPostsError('Failed to load posts: ' + error.message);
          }
          
          setPostsLoading(false);
        }
      );

      return () => {
        console.log('🔌 Cleaning up user posts listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up posts listener:', error);
      setPostsError('Failed to set up posts feed');
      setPostsLoading(false);
    }
  }, [currentUser?.uid]);

  // Update temp data when profile data changes
  useEffect(() => {
    if (profileData) {
      setTempData({
        displayName: profileData.displayName || '',
        bio: profileData.bio || '',
        aboutMe: profileData.aboutMe || '',
        location: profileData.location || '',
        craftType: profileData.craftType || '',
        experience: profileData.experience || '',
        skills: profileData.skills || [],
        contact: {
          phone: profileData.contact?.phone || '',
          website: profileData.contact?.website || '',
          social: {
            instagram: profileData.contact?.social?.instagram || '',
            facebook: profileData.contact?.social?.facebook || '',
            twitter: profileData.contact?.social?.twitter || ''
          }
        }
      });
      setNewUsername(profileData.username || '');
    }
  }, [profileData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const result = await onProfileUpdate(tempData);
      if (result.success) {
        setEditMode(false);
        setMessage('✅ Profile saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error: ' + result.error);
      }
    } catch (error) {
      setMessage('❌ Error saving profile: ' + error.message);
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    setTempData({
      displayName: profileData?.displayName || '',
      bio: profileData?.bio || '',
      aboutMe: profileData?.aboutMe || '',
      location: profileData?.location || '',
      craftType: profileData?.craftType || '',
      experience: profileData?.experience || '',
      skills: profileData?.skills || [],
      contact: {
        phone: profileData?.contact?.phone || '',
        website: profileData?.contact?.website || '',
        social: {
          instagram: profileData?.contact?.social?.instagram || '',
          facebook: profileData?.contact?.social?.facebook || '',
          twitter: profileData?.contact?.social?.twitter || ''
        }
      }
    });
    setEditMode(false);
    setMessage('');
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      setMessage('❌ Username cannot be empty');
      return;
    }

    if (newUsername.length < 3) {
      setMessage('❌ Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      const result = await updateUsername(newUsername.trim());
      if (result.success) {
        setEditingUsername(false);
        setMessage('✅ Username updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (error) {
      setMessage('❌ Error updating username: ' + error.message);
    }
    setSaving(false);
  };

  const handleSkillToggle = (skill) => {
    const currentSkills = tempData.skills || [];
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    
    setTempData({...tempData, skills: updatedSkills});
  };

  const handleImageUpload = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setMessage('❌ Image size should be less than 10MB');
        return;
      }

      setUploading(true);
      try {
        const result = await uploadImage(file, type);
        if (result.success) {
          setMessage(`✅ ${type === 'profile' ? 'Profile' : 'Cover'} image updated!`);
          setTimeout(() => setMessage(''), 3000);
          
          // Update the profile with new image
          if (onImageUpload) {
            onImageUpload(result.data.url, type);
          }
        } else {
          setMessage('❌ Error uploading image: ' + result.error);
        }
      } catch (error) {
        setMessage('❌ Error uploading image: ' + error.message);
      }
      setUploading(false);
    };
    input.click();
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Message Display */}
      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#e8f8f6' : '#fff5f5',
          color: message.includes('✅') ? '#4ecdc4' : '#ff6b6b',
          border: `1px solid ${message.includes('✅') ? '#4ecdc4' : '#ff6b6b'}`,
          marginBottom: '2rem',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      {/* Cover Image Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        position: 'relative',
        marginBottom: '2rem'
      }}>
        <div style={{
          height: '200px',
          backgroundImage: profileData?.coverImage ? `url(${profileData.coverImage})` : 'linear-gradient(135deg, #4ecdc4, #44a08d)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}>
          <button
            onClick={() => handleImageUpload('cover')}
            disabled={uploading}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              opacity: uploading ? 0.7 : 1
            }}
          >
            {uploading ? 'Uploading...' : '📷 Change Cover'}
          </button>
        </div>

        {/* Profile Content */}
        <div style={{ padding: '2rem', position: 'relative' }}>
          {/* Profile Image */}
          <div 
            style={{
              position: 'absolute',
              top: '-50px',
              left: '2rem',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '4px solid white',
              overflow: 'hidden',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
            onClick={() => handleImageUpload('profile')}
          >
            <InitialsAvatar
              name={profileData?.displayName || currentUser?.displayName || 'You'}
              imageUrl={profileData?.profileImage || currentUser?.photoURL}
              size={100}
              fontSize={32}
            />
            <div style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              backgroundColor: '#4ecdc4',
              color: 'white',
              borderRadius: '50%',
              width: '25px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>
              ✏️
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '1rem',
            gap: '1rem'
          }}>
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: '#4ecdc4',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  backgroundColor: '#4ecdc4',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div style={{ marginTop: '3rem' }}>
            {/* Display Name */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                margin: '0 0 0.5rem 0', 
                color: '#333',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}>
                {editMode ? (
                  <input
                    type="text"
                    value={tempData.displayName}
                    onChange={(e) => setTempData({...tempData, displayName: e.target.value})}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#333',
                      outline: 'none',
                      borderBottom: '2px solid #4ecdc4',
                      width: '100%'
                    }}
                    placeholder="Your display name"
                  />
                ) : (
                  profileData?.displayName || 'Your Name'
                )}
              </h2>

              {/* Username Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {editingUsername ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#666' }}>@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #4ecdc4',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}
                      placeholder="Enter username"
                    />
                    <button
                      onClick={handleUsernameUpdate}
                      disabled={saving}
                      style={{
                        backgroundColor: '#4ecdc4',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {saving ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(profileData?.username || '');
                      }}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      @{profileData?.username || 'username_not_set'}
                    </span>
                    <button
                      onClick={() => setEditingUsername(true)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #4ecdc4',
                        color: '#4ecdc4',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {editMode ? (
                  <select
                    value={tempData.craftType}
                    onChange={(e) => setTempData({...tempData, craftType: e.target.value})}
                    style={{
                      backgroundColor: '#e8f8f6',
                      color: '#4ecdc4',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      border: 'none'
                    }}
                  >
                    <option value="">Select craft type</option>
                    {skillsList.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{
                    backgroundColor: '#e8f8f6',
                    color: '#4ecdc4',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    🎨 {profileData?.craftType || 'Artisan'}
                  </span>
                )}

                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  📍 {editMode ? (
                    <input
                      type="text"
                      value={tempData.location}
                      onChange={(e) => setTempData({...tempData, location: e.target.value})}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.9rem',
                        color: '#666',
                        outline: 'none',
                        borderBottom: '1px solid #4ecdc4'
                      }}
                      placeholder="Your location"
                    />
                  ) : (
                    profileData?.location || 'Location not set'
                  )}
                </span>

                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  👥 {profileData?.followers || 0} followers
                </span>

                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  👥 {profileData?.following || 0} following  
                </span>

                {profileData?.verified && (
                  <span style={{ color: '#4ecdc4', fontSize: '1rem' }} title="Verified Artist">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>

            {/* Bio Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#4ecdc4', marginBottom: '1rem' }}>Bio</h3>
              {editMode ? (
                <textarea
                  value={tempData.bio}
                  onChange={(e) => setTempData({...tempData, bio: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  placeholder="Tell people about your craft and passion..."
                />
              ) : (
                <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
                  {profileData?.bio || 'No bio added yet. Click edit to add your story!'}
                </p>
              )}
            </div>

            {/* Skills Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#4ecdc4', marginBottom: '1rem' }}>Skills & Specializations</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {editMode ? (
                  skillsList.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      style={{
                        backgroundColor: tempData.skills?.includes(skill) ? '#4ecdc4' : '#f8f9fa',
                        color: tempData.skills?.includes(skill) ? 'white' : '#666',
                        border: '1px solid #ddd',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: tempData.skills?.includes(skill) ? 'bold' : 'normal'
                      }}
                    >
                      {skill}
                    </button>
                  ))
                ) : (
                  profileData?.skills?.length > 0 ? (
                    profileData.skills.map(skill => (
                      <span
                        key={skill}
                        style={{
                          backgroundColor: '#4ecdc4',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                      No skills added yet. Edit your profile to showcase your expertise!
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div style={{
  backgroundColor: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  padding: '2rem'
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
    <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
      📚 Your Posts ({userPosts.length})
    </h3>
    <div style={{
      backgroundColor: postsLoading ? '#f8f9fa' : '#e8f8f6',
      color: postsLoading ? '#666' : '#4ecdc4',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: 'bold'
    }}>
      {postsLoading ? 'Loading...' : `${userPosts.length} posts`}
    </div>
  </div>

  {postsLoading ? (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <p>Loading your posts...</p>
    </div>
  ) : postsError ? (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
      <p style={{ color: '#ff6b6b' }}>{postsError}</p>
      {postsError.includes('Index') && (
        <p style={{ color: '#4ecdc4', fontSize: '0.9rem' }}>
          This usually takes 2-5 minutes. Your posts will appear automatically once ready.
        </p>
      )}
    </div>
  ) : userPosts.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
      <h4 style={{ margin: '0 0 0.5rem 0' }}>No Posts Yet</h4>
      <p style={{ margin: '0 0 1rem 0' }}>
        Share your first creation with the community!
      </p>
      <p style={{ color: '#4ecdc4', fontSize: '0.9rem' }}>
        Go to "Create Post" to showcase your artwork
      </p>
    </div>
  ) : (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem' 
    }}>
      {userPosts.map((post) => (
        <div
          key={post.id}
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e9ecef',
            position: 'relative'
          }}
        >
          {/* Post Header with Delete Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <InitialsAvatar
                name={post.authorName || 'You'}
                imageUrl={post.authorAvatar || profileData?.profileImage}
                size={40}
                fontSize={16}
                style={{ marginRight: '0.75rem' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {post.authorName || profileData?.displayName || 'You'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {formatTimeAgo(post.createdAt)}
                </div>
              </div>
            </div>
            
            {/* Delete Button */}
            <button
              onClick={() => handleDeletePost(post.id, post.title)}
              style={{
                backgroundColor: '#ff4757',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ff3742'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff4757'}
            >
              🗑️ Delete
            </button>
          </div>

          {/* Post Image */}
          {post.imageUrl && (
            <div style={{ position: 'relative' }}>
              <img
                src={post.imageUrl}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}
          
          {/* Post Content */}
          <div style={{ padding: '1rem' }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#333'
            }}>
              {post.title}
            </h4>
            
            {post.description && (
              <p style={{ 
                margin: '0 0 1rem 0', 
                color: '#666', 
                fontSize: '0.95rem',
                lineHeight: '1.5'
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
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post Stats */}
            <div style={{ 
              display: 'flex', 
              gap: '1.5rem',
              fontSize: '0.85rem',
              color: '#666',
              paddingTop: '1rem',
              borderTop: '1px solid #e9ecef'
            }}>
              <span>❤️ {post.likes || 0} likes</span>
              <span>💬 {post.comments || 0} comments</span>
              <span>📤 {post.shares || 0} shares</span>
              <span>👀 {post.views || 0} views</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  );
};

export default UserProfile;
