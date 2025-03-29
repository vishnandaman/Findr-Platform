import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import QRCodeModal from './QRCodeModal';
import VerificationBadge from './VerificationBadge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const LostItemsFeed = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToItems();
    return () => unsubscribe();
  }, []);

  const subscribeToItems = () => {
    try {
      const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate();
          const timeAgo = createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : 'Recently';
          
          return {
            id: doc.id,
            ...data,
            timeAgo,
            dateLost: createdAt?.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) || 'Date not available',
            image: data.images?.[0] || 'https://placehold.co/300x200?text=No+Image',
            claimStatus: data.claimStatus || null
          };
        });
        setAllItems(itemsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching items:", error);
        setError("Failed to load items. Please try again.");
        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up subscription:", error);
      setError("Error initializing feed.");
      setLoading(false);
      return () => {};
    }
  };

  const handleClaimItem = async (itemId) => {
    if (!auth.currentUser) {
      toast.info('Please login to claim items', { autoClose: 3000 });
      navigate('/login');
      return;
    }

    // Quick check if item exists before navigating
    try {
      const docRef = doc(db, 'items', itemId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        toast.error('This item is no longer available');
        return;
      }
      
      const itemData = docSnap.data();
      if (itemData.claimStatus === 'pending') {
        toast.info('This item already has a pending claim');
        return;
      }

      // Check if user is trying to claim their own item
      if (itemData.postedBy?.userId === auth.currentUser.uid) {
        toast.error("You can't claim your own item");
        return;
      }

      navigate(`/claim/${itemId}`);
    } catch (error) {
      console.error('Error checking item:', error);
      toast.error('Failed to load item details');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filterItems = (items) => {
    let filtered = [...items];
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.status === activeTab);
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch(filters.dateRange) {
        case 'today': cutoffDate.setHours(0, 0, 0, 0); break;
        case 'week': cutoffDate.setDate(cutoffDate.getDate() - 7); break;
        case 'month': cutoffDate.setMonth(cutoffDate.getMonth() - 1); break;
        default: break;
      }
      
      filtered = filtered.filter(item => {
        const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        return itemDate >= cutoffDate;
      });
    }
    
    return filtered;
  };

  const filteredItems = filterItems(allItems);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading items...</p>
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
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            <i className="bi bi-grid me-2"></i>All Items
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'lost' ? 'active' : ''}`} onClick={() => setActiveTab('lost')}>
            <i className="bi bi-search me-2"></i>Lost Items
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'found' ? 'active' : ''}`} onClick={() => setActiveTab('found')}>
            <i className="bi bi-hand-thumbs-up me-2"></i>Found Items
          </button>
        </li>
      </ul>

      <div className="row mb-4">
        <div className="col-md-6">
          <select className="form-select" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="IDs">IDs</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="col-md-6">
          <select className="form-select" value={filters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="row">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="position-absolute top-0 end-0 m-2">
                  <VerificationBadge status={item.status} />
                  {item.claimStatus === 'pending' && (
                    <span className="badge bg-warning">Claim Pending</span>
                  )}
                </div>
                
                <img
                  src={item.image}
                  className="card-img-top"
                  alt={item.title}
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x200?text=No+Image';
                    e.target.onerror = null;
                  }}
                />
                
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.title}</h5>
                  
                  {item.status === 'found' || item.status === 'pending_verification' ? (
                    <>
                      <p className="card-text">
                        <small className="text-muted">
                          <i className="bi bi-clock"></i> {item.timeAgo}
                        </small>
                      </p>
                      <p className="card-text">
                        <small className="text-muted">
                          <i className="bi bi-person"></i> Posted by {item.postedBy?.name || 'Anonymous'}
                        </small>
                      </p>
                      <div className="alert alert-info mt-2">
                        <small>Details will be shown after verification</small>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="card-text">
                        <small className="text-muted">
                          <i className="bi bi-geo-alt"></i> {item.location?.name || 'Location not specified'}
                        </small>
                      </p>
                      <p className="card-text">
                        <small className="text-muted">
                          <i className="bi bi-calendar"></i> {item.dateLost}
                        </small>
                      </p>
                      <p className="card-text">{item.description?.substring(0, 100) || 'No description'}...</p>
                    </>
                  )}
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center">
                      {item.claimantId ? (
                        <Link to={`/chat/${item.id}`} className="btn btn-success btn-sm">
                          Let's Chat
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleClaimItem(item.id)}
                          className="btn btn-outline-primary btn-sm"
                          disabled={item.status !== 'found' || item.claimStatus === 'pending' || item.postedBy?.userId === auth.currentUser?.uid}
                        >
                          {item.claimStatus === 'pending' ? 'Claim Pending' : 'Claim Item'}
                        </button>
                      )}
                      {item.status === 'found' && <QRCodeModal itemId={item.id} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <div className="alert alert-info">
              No items found matching your criteria
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LostItemsFeed;