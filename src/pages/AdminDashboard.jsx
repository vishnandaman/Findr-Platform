import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
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
      (snapshot) => {
        try {
          const claims = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              postedDate: data.createdAt?.toDate()?.toLocaleDateString(),
              claimDate: data.updatedAt?.toDate()?.toLocaleDateString(),
              formattedDate: formatDate(data.createdAt),
              claimantName: data.claimantName || 'Unknown User',
              finderName: data.postedBy?.name || 'Unknown Finder'
            };
          });
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

  const handleVerifyClaim = async (isApproved) => {
    if (!selectedClaim) return;

    try {
      // Validate claim exists first
      const claimRef = doc(db, 'claims', selectedClaim.id);
      await updateDoc(claimRef, {
        status: isApproved ? 'approved' : 'rejected',
        updatedAt: serverTimestamp()
      });

      // Update item status
      await updateDoc(itemRef, {
        claimStatus: isApproved ? 'approved' : 'rejected',
        status: isApproved ? 'returned' : 'found',
        updatedAt: serverTimestamp()
      });
  

      // Update chat status if approved
      if (isApproved) {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('itemId', '==', selectedClaim.id)
        );
        const chatSnap = await getDocs(chatsQuery);
        
        chatSnap.forEach(async (chatDoc) => {
          await updateDoc(chatDoc.ref, {
            status: 'active',
            updatedAt: serverTimestamp()
          });
        });
      }

      // Create notification promises
      const notificationPromises = [
        addDoc(collection(db, 'notifications'), {
          userId: selectedClaim.claimantId,
          type: isApproved ? 'claim_approved' : 'claim_rejected',
          itemId: selectedClaim.id,
          itemTitle: selectedClaim.title,
          read: false,
          createdAt: serverTimestamp()
        }),
        addDoc(collection(db, 'notifications'), {
          userId: selectedClaim.postedBy?.userId,
          type: 'claim_processed',
          itemId: selectedClaim.id,
          itemTitle: selectedClaim.title,
          approved: isApproved,
          read: false,
          createdAt: serverTimestamp()
        })
      ];

      // Send notifications
      await Promise.all(notificationPromises);

      toast.success(`Claim ${isApproved ? 'approved' : 'rejected'} successfully!`);
      setSelectedClaim(null);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.message || `Failed to ${isApproved ? 'approve' : 'reject'} claim`);
      setSelectedClaim(null); // Clear selection to prevent further errors
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
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5>Pending Claims</h5>
              </div>
              <div className="card-body">
                {pendingClaims.length === 0 ? (
                  <div className="alert alert-info">No pending claims</div>
                ) : (
                  <div className="list-group">
                    {pendingClaims.map(claim => (
                      <button
                        key={claim.id}
                        className={`list-group-item list-group-item-action text-start ${
                          selectedClaim?.id === claim.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6>{claim.title}</h6>
                            <small className="d-block">Category: {claim.category || 'Unknown'}</small>
                            <small className="d-block">Claimant: {claim.claimantName || 'Unknown'}</small>
                            <small className="d-block">Finder: {claim.finderName || 'Unknown'}</small>
                          </div>
                          <small className="text-muted">{claim.formattedDate}</small>
                        </div>
                        <small className="d-block mt-2">
                          Claim submitted: {claim.claimDate || 'Unknown date'}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5>Claim Verification</h5>
              </div>
              <div className="card-body">
                {selectedClaim ? (
                  <>
                    <h4>{selectedClaim.title}</h4>
                    <div className="mb-3">
                      <p><strong>Category:</strong> {selectedClaim.category || 'Unknown'}</p>
                      <p><strong>Claimant:</strong> {selectedClaim.claimantName || selectedClaim.claimantId || 'Unknown'}</p>
                      <p><strong>Finder:</strong> {selectedClaim.finderName || selectedClaim.postedBy?.userId || 'Unknown'}</p>
                      <p><strong>Submitted:</strong> {selectedClaim.formattedDate || selectedClaim.claimDate || 'Unknown date'}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h5>Item Details</h5>
                      <p>{selectedClaim.description || 'No description provided'}</p>
                      <p><strong>Location:</strong> {selectedClaim.location?.name || 'Not specified'}</p>
                    </div>
                    
                    <div className="d-flex gap-2 mt-4">
                      <button
                        onClick={() => handleVerifyClaim(false)}
                        className="btn btn-danger flex-grow-1"
                      >
                        Reject Claim
                      </button>
                      <button
                        onClick={() => handleVerifyClaim(true)}
                        className="btn btn-success flex-grow-1"
                      >
                        Approve Claim
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-card-checklist fs-1"></i>
                    <p>Select a claim to verify</p>
                  </div>
                )}
              </div>
            </div>
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