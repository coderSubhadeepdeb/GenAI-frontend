import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  addDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL
} from 'firebase/storage';
import { auth, googleProvider, db, storage } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState('online');

  // ===== PROFILE MANAGEMENT =====

  // Real-time user profile loading
  const loadUserProfile = useCallback((userId) => {
    if (!userId) {
      setUserProfile(null);
      setProfileLoading(false);
      return null;
    }

    console.log(`Setting up real-time listener for user profile: ${userId}`);
    setProfileLoading(true);
    
    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userRef, 
      (doc) => {
        if (doc.exists()) {
          const profileData = doc.data();
          setUserProfile(profileData);
          console.log('✅ User profile loaded (real-time):', profileData);
        } else {
          console.log('ℹ️ No user profile found, creating default');
          createDefaultProfile(userId);
        }
        setProfileLoading(false);
      },
      (error) => {
        console.error('❌ Error loading profile:', error);
        setProfileLoading(false);
        
        // Fallback: try one-time read
        getDoc(userRef).then((doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
            console.log('✅ User profile loaded (fallback):', doc.data());
          } else {
            createDefaultProfile(userId);
          }
          setProfileLoading(false);
        }).catch((error) => {
          console.error('❌ Fallback profile load failed:', error);
          setUserProfile(null);
          setProfileLoading(false);
        });
      }
    );

    return unsubscribe;
  }, []);

  // Create default user profile
  const createDefaultProfile = async (userId) => {
    const user = auth.currentUser;
    if (!user) return;

    const defaultProfile = {
      uid: userId,
      email: user.email,
      displayName: user.displayName || '',
      username: `user_${userId.slice(-6)}`,
      bio: '',
      aboutMe: '',
      location: '',
      craftType: '',
      experience: '',
      profileImage: user.photoURL || '',
      coverImage: '',
      skills: [],
      achievements: [],
      contact: {
        email: user.email,
        phone: '',
        website: '',
        social: {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      },
      posts: [],
      isPublic: true,
      verified: false,
      followers: 0,
      following: 0,
      postsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', userId), defaultProfile);
      console.log('✅ Default profile created');
      setUserProfile(defaultProfile);
    } catch (error) {
      console.error('❌ Failed to create default profile:', error);
    }
  };

  // Save user profile
  const saveUserProfile = async (profileData) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Profile saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Update username with validation
  const updateUsername = async (newUsername) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Check if username is already taken
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', newUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0].id !== currentUser.uid) {
        return { success: false, error: 'Username already taken' };
      }

      // Update username
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: newUsername,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Username updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update username:', error);
      return { success: false, error: error.message };
    }
  };

  // ===== IMAGE UPLOAD =====

  // Enhanced image upload function
  const uploadImage = async (file, type = 'general', onProgress = null) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    try {
      console.log('📤 Starting upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadType: type
      });

      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `${currentUser.uid}/posts/${fileName}`;
      
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`📊 Upload progress: ${Math.round(progress)}%`);
            
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          },
          (error) => {
            console.error('❌ Upload error:', error);
            
            // Handle specific Firebase Storage errors
            let errorMessage = 'Upload failed';
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'Permission denied. Please check your authentication.';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload was canceled.';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Storage quota exceeded.';
                break;
              case 'storage/invalid-format':
                errorMessage = 'Invalid file format.';
                break;
              case 'storage/retry-limit-exceeded':
                errorMessage = 'Upload failed after multiple retries.';
                break;
              default:
                errorMessage = error.message || 'Unknown upload error occurred.';
            }
            
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ Upload successful. URL:', downloadURL);
              
              resolve({
                success: true,
                data: {
                  url: downloadURL,
                  path: filePath,
                  name: fileName,
                  originalName: file.name,
                  size: file.size,
                  type: file.type
                }
              });
            } catch (error) {
              console.error('❌ Error getting download URL:', error);
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ Upload setup error:', error);
      throw error;
    }
  };

  // ===== POST MANAGEMENT =====

  // Create post
  const createPost = async (postData) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const postsRef = collection(db, 'posts');
      const newPost = {
        ...postData,
        authorId: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName,
        authorAvatar: userProfile?.profileImage || currentUser.photoURL,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(postsRef, newPost);
      
      // Update user's posts count
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        postsCount: increment(1)
      });
      
      return {
        success: true,
        data: { id: docRef.id, ...newPost }
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user posts
  const getUserPosts = async (userId = null) => {
    try {
      const targetUserId = userId || currentUser?.uid;
      if (!targetUserId) return [];

      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('authorId', '==', targetUserId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const posts = [];

      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });

      return posts;
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  };

  // ===== FOLLOW SYSTEM =====

  // Follow user
  const followUser = async (targetUserId) => {
    console.log('🚀 Starting follow process...', {
      currentUser: currentUser?.uid,
      targetUser: targetUserId
    });

    if (!currentUser) {
      console.error('❌ No user logged in');
      return { success: false, error: 'No user logged in' };
    }

    if (currentUser.uid === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    try {
      console.log('📝 Creating batch operations...');
      const batch = writeBatch(db);

      // Add to current user's following
      const followingRef = doc(db, `following/${currentUser.uid}/myFollowing/${targetUserId}`);
      console.log('📂 Following path:', followingRef.path);
      batch.set(followingRef, {
        uid: targetUserId,
        followedAt: serverTimestamp()
      });

      // Add to target user's followers
      const followersRef = doc(db, `followers/${targetUserId}/myFollowers/${currentUser.uid}`);
      console.log('📂 Followers path:', followersRef.path);
      batch.set(followersRef, {
        uid: currentUser.uid,
        followedAt: serverTimestamp()
      });

      // Update current user's following count
      const currentUserRef = doc(db, 'users', currentUser.uid);
      batch.update(currentUserRef, {
        following: increment(1)
      });

      // Update target user's followers count
      const targetUserRef = doc(db, 'users', targetUserId);
      batch.update(targetUserRef, {
        followers: increment(1)
      });

      console.log('🚀 Committing batch...');
      await batch.commit();

      console.log('✅ Successfully followed user');
      return { success: true };
    } catch (error) {
      console.error('❌ Follow error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  };

  // Unfollow user
  const unfollowUser = async (targetUserId) => {
    if (!currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const batch = writeBatch(db);

      // Remove from current user's following
      const followingRef = doc(db, `following/${currentUser.uid}/myFollowing/${targetUserId}`);
      batch.delete(followingRef);

      // Remove from target user's followers
      const followersRef = doc(db, `followers/${targetUserId}/myFollowers/${currentUser.uid}`);
      batch.delete(followersRef);

      // Update current user's following count
      const currentUserRef = doc(db, 'users', currentUser.uid);
      batch.update(currentUserRef, {
        following: increment(-1)
      });

      // Update target user's followers count
      const targetUserRef = doc(db, 'users', targetUserId);
      batch.update(targetUserRef, {
        followers: increment(-1)
      });

      await batch.commit();

      console.log('✅ Successfully unfollowed user');
      return { success: true };
    } catch (error) {
      console.error('❌ Error unfollowing user:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if following user
  const isFollowing = async (targetUserId) => {
    if (!currentUser) return false;

    try {
      const followingRef = doc(db, `following/${currentUser.uid}/myFollowing/${targetUserId}`);
      const followingDoc = await getDoc(followingRef);
      return followingDoc.exists();
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  // ===== SEARCH USERS =====

  // Search users
  const searchUsers = async (searchTerm, craftType = 'all') => {
    try {
      const usersRef = collection(db, 'users');
      let q;

      if (craftType !== 'all') {
        q = query(
          usersRef, 
          where('craftType', '==', craftType),
          where('isPublic', '==', true),
          limit(20)
        );
      } else {
        q = query(
          usersRef, 
          where('isPublic', '==', true),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      let users = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Client-side filtering for search term
        if (!searchTerm || 
            userData.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.craftType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))) {
          users.push({ id: doc.id, ...userData });
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // ===== AUTHENTICATION STATE MANAGEMENT =====

  useEffect(() => {
    let profileUnsubscribe = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        setCurrentUser(user);
        profileUnsubscribe = loadUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setProfileLoading(false);
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
      }
      setLoading(false);
    });

    // Monitor network status
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadUserProfile]);

  // ===== AUTHENTICATION METHODS =====

  // Sign up
  const signup = async (email, password, userData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userData.displayName) {
        await updateProfile(result.user, {
          displayName: userData.displayName
        });
      }

      return { success: true, user: result.user };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', result.user.email);
      
      // Redirect to home (social feed) instead of dashboard
      navigate('/'); // Changed from navigate('/dashboard')
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Google sign-in
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ===== CONTEXT VALUE =====

  const value = {
    // State
    currentUser,
    userProfile,
    loading,
    profileLoading,
    networkStatus,
    
    // Authentication
    signup,
    login,
    signInWithGoogle,
    logout,
    
    // Profile Management
    saveUserProfile,
    updateUsername,
    
    // Image Upload
    uploadImage,
    
    // Post Management
    createPost,
    getUserPosts,
    
    // Follow System
    followUser,
    unfollowUser,
    isFollowing,
    
    // Search
    searchUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
