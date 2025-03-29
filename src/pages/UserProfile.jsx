import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Notifications from '../components/Notifications';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    claimedItems: 0
  });
  const [isAdmin, setIsAdmin] = useState(false); // Add admin state

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          // Check if user is admin (you'll need to implement your own admin check logic)
          setIsAdmin(profileData.role === 'admin');
        } else {
          // Create new profile if it doesn't exist
          const newProfile = {
            name: auth.currentUser.displayName || 'Anonymous',
            email: auth.currentUser.email,
            contactInfo: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await updateDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserItems = async () => {
      try {
        const itemsQuery = query(
          collection(db, "items"),
          where("postedBy.userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(itemsQuery);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserItems(items);

        // Calculate stats
        setStats({
          totalItems: items.length,
          lostItems: items.filter(item => item.status === 'lost').length,
          foundItems: items.filter(item => item.status === 'found').length,
          claimedItems: items.filter(item => item.status === 'claimed').length
        });
      } catch (error) {
        console.error("Error fetching user items:", error);
        setError(error.message);
      }
    };

    fetchProfile();
    fetchUserItems();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, {
        ...profile,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-md-4">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title mb-4">Profile Information</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.name || ''}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile?.email || ''}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Information</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={profile?.contactInfo || ''}
                    onChange={(e) => setProfile({...profile, contactInfo: e.target.value})}
                    placeholder="Enter your contact details..."
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {/* Add Notifications component at the top of the right column */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title mb-4">Notifications</h2>
              <Notifications userId={auth.currentUser.uid} isAdmin={isAdmin} />
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title mb-4">Your Activity</h2>
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <h3 className="mb-0">{stats.totalItems}</h3>
                    <small className="text-muted">Total Items</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <h3 className="mb-0">{stats.lostItems}</h3>
                    <small className="text-muted">Lost Items</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <h3 className="mb-0">{stats.foundItems}</h3>
                    <small className="text-muted">Found Items</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <h3 className="mb-0">{stats.claimedItems}</h3>
                    <small className="text-muted">Claimed Items</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Your Items</h2>
              {userItems.length === 0 ? (
                <div className="alert alert-info">
                  You haven't posted any items yet.
                </div>
              ) : (
                <div className="list-group">
                  {userItems.map((item) => (
                    <div key={item.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1">{item.title}</h5>
                          <p className="mb-1 text-muted">
                            <small>
                              Status: <span className={`badge bg-${item.status === 'lost' ? 'danger' : item.status === 'found' ? 'success' : 'primary'}`}>
                                {item.status}
                              </span>
                            </small>
                          </p>
                        </div>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/item/${item.id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;