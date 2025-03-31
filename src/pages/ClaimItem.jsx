import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-toastify';

const ClaimItem = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [claimDescription, setClaimDescription] = useState('');
  const [proofImages, setProofImages] = useState([]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
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
        setError(null);
      } catch (error) {
        console.error('Error fetching item:', error);
        setError(error.message);
        toast.error(error.message || 'Failed to load item details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    if (itemId) {
      fetchItem();
    } else {
      setError('Invalid item ID');
      setLoading(false);
      navigate('/');
    }
  }, [itemId, navigate]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Only JPG, PNG, and GIF images are allowed');
      return;
    }

    setProofImages(files);
  };

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
  
    if (!claimDescription.trim()) {
      toast.error('Please provide a description of why you believe this is your item');
      return;
    }
  
    if (item?.postedBy?.userId === auth.currentUser.uid) {
      toast.error("You can't claim your own item");
      return;
    }
  
    setIsClaiming(true);
    try {
      const itemRef = doc(db, 'items', itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (!itemSnap.exists()) {
        throw new Error('Item no longer exists');
      }
  
      const itemData = itemSnap.data();
      
      // Check if user already has a pending claim for this item
      const existingClaimQuery = query(
        collection(db, 'claims'),
        where('itemId', '==', itemId),
        where('claimantId', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const existingClaimSnap = await getDocs(existingClaimQuery);
      if (!existingClaimSnap.empty) {
        throw new Error('You already have a pending claim for this item');
      }

      // Upload proof images if any
      const uploadedImageUrls = [];
      if (proofImages.length > 0) {
        // In a real app, you would upload these to Firebase Storage
        // For this example, we'll just store the file names
        uploadedImageUrls.push(...proofImages.map(file => file.name));
      }

      // Create the claim document
      const claimRef = await addDoc(collection(db, 'claims'), {
        itemId,
        itemTitle: item.title,
        itemImage: item.images?.[0] || '',
        claimantId: auth.currentUser.uid,
        claimantName: auth.currentUser.displayName || 'Anonymous',
        claimantEmail: auth.currentUser.email || '',
        finderId: item.postedBy?.userId || 'unknown',
        finderName: item.postedBy?.name || 'Unknown',
        status: 'pending',
        description: claimDescription,
        proofImages: uploadedImageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create chat between claimant and finder
      const chatRef = await addDoc(collection(db, 'chats'), {
        itemId,
        itemTitle: item.title,
        finderId: item.postedBy?.userId || 'unknown',
        claimantId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        participants: [
          item.postedBy?.userId || 'unknown',
          auth.currentUser.uid
        ],
        lastMessage: {
          text: `Claim submitted for ${item.title}`,
          sender: auth.currentUser.uid,
          timestamp: serverTimestamp()
        },
        unreadCount: 1
      });

      // Update the claim with chat ID
      await updateDoc(claimRef, {
        chatId: chatRef.id
      });

      // Notify admin
      await addDoc(collection(db, 'adminNotifications'), {
        type: 'new_claim',
        itemId,
        claimId: claimRef.id,
        itemTitle: item.title,
        claimantId: auth.currentUser.uid,
        claimantName: auth.currentUser.displayName || 'Anonymous',
        finderId: item.postedBy?.userId || 'unknown',
        chatId: chatRef.id,
        read: false,
        createdAt: serverTimestamp()
      });

      // Notify item owner
      await addDoc(collection(db, 'notifications'), {
        userId: item.postedBy?.userId || 'unknown',
        type: 'claim_submitted',
        itemId,
        itemTitle: item.title,
        claimId: claimRef.id,
        chatId: chatRef.id,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success('Claim submitted successfully! Admin will review your claim.', {
        autoClose: 5000
      });
      navigate('/my-claims');
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
            {item.images?.[0] && (
              <img 
                src={item.images[0]} 
                alt={item.title}
                className="img-fluid rounded mb-3"
                style={{maxHeight: '200px'}}
              />
            )}
            <p>{item.description || 'No description provided'}</p>
            <p><strong>Location Found:</strong> {item.location?.name || 'Not specified'}</p>
            <p><strong>Date Found:</strong> {item.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}</p>
            
            {item.postedBy?.userId === auth.currentUser?.uid && (
              <div className="alert alert-warning">
                You cannot claim your own item
              </div>
            )}
          </div>

          <div className="mb-4">
            <h5>Claim Details</h5>
            <div className="form-group mb-3">
              <label htmlFor="claimDescription" className="form-label">
                Why do you believe this is your item?*
              </label>
              <textarea
                id="claimDescription"
                className="form-control"
                rows="4"
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                required
                placeholder="Please provide detailed information about why you believe this is your item..."
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="proofImages" className="form-label">
                Upload Proof (Optional)
              </label>
              <input
                type="file"
                id="proofImages"
                className="form-control"
                multiple
                accept="image/jpeg, image/png, image/gif"
                onChange={handleImageUpload}
              />
              <small className="text-muted">
                Upload up to 3 images that prove this item belongs to you (receipts, photos, etc.)
              </small>
              {proofImages.length > 0 && (
                <div className="mt-2">
                  <small>Selected files: {proofImages.map(img => img.name).join(', ')}</small>
                </div>
              )}
            </div>
          </div>
          
          <div className="d-grid gap-2">
            <button 
              onClick={submitClaim}
              disabled={
                isClaiming || 
                item.postedBy?.userId === auth.currentUser?.uid || 
                !claimDescription.trim()
              }
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