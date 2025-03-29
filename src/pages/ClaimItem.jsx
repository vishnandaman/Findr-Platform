import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-toastify';

const ClaimItem = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        // Validate itemId exists and is a non-empty string
        if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
          throw new Error('Invalid item ID');
        }

        const docRef = doc(db, 'items', itemId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Item not found');
        }
        
        const itemData = docSnap.data();
        if (!itemData) {
          throw new Error('Invalid item data');
        }
        
        setItem({
          id: docSnap.id,
          title: itemData.title || 'Untitled Item',
          category: itemData.category || 'Other',
          postedBy: itemData.postedBy || { userId: 'unknown' },
          ...itemData
        });
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error fetching item:', error);
        setError(error.message);
        toast.error(error.message || 'Failed to load item details');
        navigate('/'); // Redirect to home if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we have a valid itemId
    if (itemId) {
      fetchItem();
    } else {
      setError('Invalid item ID');
      setLoading(false);
      navigate('/');
    }
  }, [itemId, navigate]);

  const submitClaim = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to claim this item');
      navigate('/login');
      return;
    }

    if (!itemId) {
      toast.error('Invalid item reference');
      return;
    }

    // Check if user is trying to claim their own item
    if (item?.postedBy?.userId === auth.currentUser.uid) {
      toast.error("You can't claim your own item");
      return;
    }

    setIsClaiming(true);
  try {
    const itemRef = doc(db, 'items', itemId);
    
    // First check if item is still available for claiming
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) {
      throw new Error('Item no longer exists');
    }

    const itemData = itemSnap.data();
    if (itemData.claimStatus === 'pending') {
      throw new Error('This item already has a pending claim');
    }

    // Create the claim document in a new collection
    const claimRef = await addDoc(collection(db, 'claims'), {
      itemId,
      itemTitle: item.title,
      claimantId: auth.currentUser.uid,
      claimantName: auth.currentUser.displayName || 'Anonymous',
      finderId: item.postedBy?.userId || 'unknown',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update item with claim info
    await updateDoc(itemRef, {
      claimId: claimRef.id,  // Store reference to the claim
      claimantId: auth.currentUser.uid,
      claimStatus: 'pending',
      updatedAt: serverTimestamp(),
      claimantName: auth.currentUser.displayName || 'Anonymous'
    });

    // ... rest of your notification code ...
  } catch (error) {
    console.error('Error submitting claim:', error);
    toast.error(error.message || 'Failed to submit claim');
  } finally {
    setIsClaiming(false);
  }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || 'Item not found or unavailable'}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h2>Claim Item: {item.title}</h2>
          <p className="mb-0">Category: {item.category || 'Not specified'}</p>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h5>Item Details</h5>
            <p>{item.description || 'No description provided'}</p>
            <p><strong>Location Found:</strong> {item.location?.name || 'Not specified'}</p>
            <p><strong>Date Found:</strong> {item.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}</p>
            {item.postedBy?.userId === auth.currentUser?.uid && (
              <div className="alert alert-warning">
                You cannot claim your own item
              </div>
            )}
            {item.claimStatus === 'pending' && (
              <div className="alert alert-info">
                This item already has a pending claim
              </div>
            )}
          </div>
          
          <div className="d-grid gap-2">
            <button 
              onClick={submitClaim}
              disabled={isClaiming || item.postedBy?.userId === auth.currentUser?.uid || item.claimStatus === 'pending'}
              className="btn btn-primary py-3"
            >
              {isClaiming ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                'Submit Claim'
              )}
            </button>
            
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-outline-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimItem;