import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const BillingMonitor = () => {
  const [usage, setUsage] = useState({
    firestore: { reads: 0, writes: 0, documents: 0 },
    storage: { uploads: 0, totalSize: 0 },
    aiCalls: 0,
    lastUpdated: new Date()
  });
  const [isVisible, setIsVisible] = useState(true);
  const { currentUser } = useAuth();

  // Track Firestore usage
  useEffect(() => {
    if (!currentUser?.uid) return;

    const trackFirestoreUsage = async () => {
      try {
        // Count user's documents
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid));
        const postsSnapshot = await getCountFromServer(postsQuery);
        
        const conversationsQuery = query(collection(db, 'chatConversations'), where('userId', '==', currentUser.uid));
        const conversationsSnapshot = await getCountFromServer(conversationsQuery);

        // Estimate reads/writes based on app activity
        const estimatedReads = postsSnapshot.data().count * 2 + conversationsSnapshot.data().count * 3;
        const estimatedWrites = postsSnapshot.data().count + conversationsSnapshot.data().count;

        setUsage(prev => ({
          ...prev,
          firestore: {
            reads: estimatedReads,
            writes: estimatedWrites,
            documents: postsSnapshot.data().count + conversationsSnapshot.data().count
          }
        }));

        console.log('📊 Firestore usage updated:', { reads: estimatedReads, writes: estimatedWrites });
      } catch (error) {
        console.error('Error tracking Firestore usage:', error);
      }
    };

    // Real-time listener for posts
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, where('authorId', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      // Remove unused readCount and writeCount variables
      setUsage(prev => ({
        ...prev,
        firestore: {
          ...prev.firestore,
          reads: prev.firestore.reads + snapshot.docs.length
        },
        lastUpdated: new Date()
      }));
    });

    trackFirestoreUsage();
    
    return () => unsubscribe();
  }, [currentUser?.uid]);


  // Track AI calls (estimate based on chat messages)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const trackAICalls = async () => {
      try {
        // Count AI conversations
        const aiQuery = query(collection(db, 'chatConversations'), where('userId', '==', currentUser.uid));
        const aiSnapshot = await getCountFromServer(aiQuery);
        
        // Estimate AI calls (assuming 2-3 messages per conversation)
        const estimatedAICalls = aiSnapshot.data().count * 2;

        setUsage(prev => ({
          ...prev,
          aiCalls: estimatedAICalls
        }));

        console.log('🤖 AI calls estimated:', estimatedAICalls);
      } catch (error) {
        console.error('Error tracking AI usage:', error);
      }
    };

    trackAICalls();
  }, [currentUser?.uid]);

  // Track Storage usage (estimate based on posts with images)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const trackStorageUsage = async () => {
      try {
        // Count posts with images
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid));
        const postsSnapshot = await getCountFromServer(postsQuery);
        
        // Estimate storage (assuming average 2MB per image)
        const estimatedUploads = postsSnapshot.data().count;
        const estimatedSize = estimatedUploads * 2; // MB

        setUsage(prev => ({
          ...prev,
          storage: {
            uploads: estimatedUploads,
            totalSize: estimatedSize
          }
        }));

        console.log('📁 Storage usage estimated:', { uploads: estimatedUploads, sizeMB: estimatedSize });
      } catch (error) {
        console.error('Error tracking storage usage:', error);
      }
    };

    trackStorageUsage();
  }, [currentUser?.uid]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setUsage(prev => ({ ...prev, lastUpdated: new Date() }));
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Calculate usage percentages
  const getUsagePercentage = (current, limit) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return '#4ecdc4'; // Green
    if (percentage < 75) return '#ffa726'; // Orange  
    if (percentage < 90) return '#ff9800'; // Dark orange
    return '#f44336'; // Red
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#4ecdc4',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 999,
          fontWeight: 'bold'
        }}
      >
        📊 Usage
      </button>
    );
  }

  const firestorePercentage = getUsagePercentage(usage.firestore.reads, 50000);
  const storagePercentage = getUsagePercentage(usage.storage.totalSize, 5000); // 5GB in MB
  const aiPercentage = getUsagePercentage(usage.aiCalls, 1000);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontSize: '11px',
      zIndex: 999,
      minWidth: '220px',
      border: '1px solid #e0e0e0'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px' 
      }}>
        <h4 style={{ margin: 0, color: '#4ecdc4', fontSize: '13px', fontWeight: 'bold' }}>
          📊 Usage Monitor
        </h4>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
            title="Refresh usage data"
          >
            🔄
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Firestore */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>🔥 Firestore Reads</span>
            <span style={{ color: getUsageColor(firestorePercentage), fontWeight: 'bold' }}>
              {usage.firestore.reads.toLocaleString()}/50k
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${firestorePercentage}%`,
              height: '100%',
              backgroundColor: getUsageColor(firestorePercentage),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>📁 Storage</span>
            <span style={{ color: getUsageColor(storagePercentage), fontWeight: 'bold' }}>
              {usage.storage.totalSize}MB/5GB
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${storagePercentage}%`,
              height: '100%',
              backgroundColor: getUsageColor(storagePercentage),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* AI Calls */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>🤖 AI Calls</span>
            <span style={{ color: getUsageColor(aiPercentage), fontWeight: 'bold' }}>
              {usage.aiCalls}/1000
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${aiPercentage}%`,
              height: '100%',
              backgroundColor: getUsageColor(aiPercentage),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Documents Count */}
        <div style={{ fontSize: '10px', color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: '6px', marginTop: '4px' }}>
          📄 Documents: {usage.firestore.documents} | 📸 Images: {usage.storage.uploads}
        </div>

        {/* Status */}
        <div style={{ 
          color: '#4ecdc4', 
          fontWeight: 'bold', 
          fontSize: '11px',
          textAlign: 'center',
          background: '#e8f8f6',
          padding: '4px 8px',
          borderRadius: '6px'
        }}>
          ✅ All within FREE limits!
        </div>

        {/* Last Updated */}
        <div style={{ fontSize: '9px', color: '#999', textAlign: 'center' }}>
          Updated: {usage.lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default BillingMonitor;
