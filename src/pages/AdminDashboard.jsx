import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeTab, setActiveTab] = useState('claims');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formatDate = (firebaseTimestamp) => {
    if (!firebaseTimestamp) return 'Unknown date';
    const date = firebaseTimestamp.toDate();
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users')),
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
      }
    );

    const unsubscribeClaims = onSnapshot(
      query(collection(db, 'claims'), where('status', '==', 'pending')),
      async (snapshot) => {
        try {
          const claims = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Get item details
            let itemData = {};
            try {
              const itemSnap = await getDoc(doc(db, 'items', data.itemId));
              if (itemSnap.exists()) {
                itemData = itemSnap.data();
              }
            } catch (error) {
              console.error("Error fetching item:", error);
            }

            return {
              id: doc.id,
              ...data,
              ...itemData,
              postedDate: data.createdAt?.toDate()?.toLocaleDateString(),
              claimDate: data.updatedAt?.toDate()?.toLocaleDateString(),
              formattedDate: formatDate(data.createdAt),
              claimantName: data.claimantName || 'Unknown User',
              finderName: data.finderName || 'Unknown Finder'
            };
          }));
          
          setPendingClaims(claims);
          setError(null);
        } catch (error) {
          console.error("Error processing claims:", error);
          setError("Failed to process claims data");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching claims:", error);
        setError("Failed to load pending claims");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeClaims();
    };
  }, []);

  const handleVerifyClaim = async (isApproved, claimId = null) => {
    const claimToProcess = claimId 
      ? pendingClaims.find(c => c.id === claimId) 
      : selectedClaim;
    
    if (!claimToProcess) return;

    try {
      // Update the claim status
      const claimRef = doc(db, 'claims', claimToProcess.id);
      await updateDoc(claimRef, {
        status: isApproved ? 'approved' : 'rejected',
        updatedAt: serverTimestamp(),
        processedBy: auth.currentUser.uid,
        processedAt: serverTimestamp()
      });

      // If approved, reject all other pending claims for this item
      if (isApproved) {
        const otherClaimsQuery = query(
          collection(db, 'claims'),
          where('itemId', '==', claimToProcess.itemId),
          where('status', '==', 'pending')
        );
        
        const otherClaimsSnap = await getDocs(otherClaimsQuery);
        const batch = writeBatch(db);
        
        otherClaimsSnap.forEach((doc) => {
          if (doc.id !== claimToProcess.id) {
            batch.update(doc.ref, {
              status: 'rejected',
              updatedAt: serverTimestamp(),
              rejectionReason: 'Another claim was approved for this item'
            });
          }
        });
        
        await batch.commit();

        // Update the item status
        const itemRef = doc(db, 'items', claimToProcess.itemId);
        await updateDoc(itemRef, {
          claimStatus: 'approved',
          status: 'returned',
          updatedAt: serverTimestamp(),
          returnedTo: claimToProcess.claimantId
        });

        // Update chat status
        if (claimToProcess.chatId) {
          const chatRef = doc(db, 'chats', claimToProcess.chatId);
          await updateDoc(chatRef, {
            status: 'active',
            updatedAt: serverTimestamp()
          });
        }
      }

      // Send notifications
      const notificationPromises = [
        // To claimant
        addDoc(collection(db, 'notifications'), {
          userId: claimToProcess.claimantId,
          type: isApproved ? 'claim_approved' : 'claim_rejected',
          itemId: claimToProcess.itemId,
          itemTitle: claimToProcess.itemTitle || claimToProcess.title,
          read: false,
          createdAt: serverTimestamp()
        }),
        // To finder
        addDoc(collection(db, 'notifications'), {
          userId: claimToProcess.finderId,
          type: 'claim_processed',
          itemId: claimToProcess.itemId,
          itemTitle: claimToProcess.itemTitle || claimToProcess.title,
          approved: isApproved,
          read: false,
          createdAt: serverTimestamp()
        })
      ];

      await Promise.all(notificationPromises);

      toast.success(`Claim ${isApproved ? 'approved' : 'rejected'} successfully!`);
      setSelectedClaim(null);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.message || `Failed to ${isApproved ? 'approve' : 'reject'} claim`);
    }
  };

  const handleUserVerification = async (userId, verify) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      await updateDoc(userRef, {
        verified: verify,
        updatedAt: serverTimestamp()
      });
      toast.success(`User ${verify ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      console.error('Error updating user verification:', error);
      toast.error(error.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <button onClick={() => signOut(auth)} className="btn btn-outline-danger">
          Logout
        </button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            Pending Claims ({pendingClaims.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management ({users.length})
          </button>
        </li>
      </ul>

      {activeTab === 'claims' ? (
        <div className="row">
          <div className="col-md-12">
            {pendingClaims.length === 0 ? (
              <div className="alert alert-info">No pending claims</div>
            ) : (
              <div className="row">
                {pendingClaims.map(claim => (
                  <div key={claim.id} className="col-md-6 mb-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex">
                          <img 
                            src={claim.images?.[0] || 'https://placehold.co/300x200?text=No+Image'} 
                            alt={claim.itemTitle || claim.title}
                            className="rounded me-3"
                            style={{width: '100px', height: '100px', objectFit: 'cover'}}
                          />
                          <div className="flex-grow-1">
                            <h5>{claim.itemTitle || claim.title}</h5>
                            <p className="mb-1"><strong>Category:</strong> {claim.category || 'Unknown'}</p>
                            <p className="mb-1"><strong>Claimant:</strong> {claim.claimantName}</p>
                            <p className="mb-1"><strong>Finder:</strong> {claim.finderName || claim.postedBy?.name || 'Unknown'}</p>
                            <p className="mb-1"><strong>Submitted:</strong> {formatDate(claim.createdAt)}</p>
                            
                            <div className="mt-3 d-flex justify-content-between">
                              {claim.chatId && (
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => navigate(`/chat/${claim.chatId}`)}
                                >
                                  View Chat
                                </button>
                              )}
                              
                              <div>
                                <button 
                                  className="btn btn-sm btn-danger me-2"
                                  onClick={() => handleVerifyClaim(false, claim.id)}
                                >
                                  Reject
                                </button>
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleVerifyClaim(true, claim.id)}
                                >
                                  Approve
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5>User Management</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id.substring(0, 8)}...</td>
                      <td>{user.name || 'Anonymous'}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.verified ? 'bg-success' : 'bg-warning'}`}>
                          {user.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => handleUserVerification(user.id, true)}
                            className="btn btn-outline-success"
                            disabled={user.verified}
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleUserVerification(user.id, false)}
                            className="btn btn-outline-danger"
                            disabled={!user.verified}
                          >
                            Unverify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;