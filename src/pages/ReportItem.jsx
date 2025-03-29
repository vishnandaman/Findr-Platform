import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { generateSecretCode } from '../firebase/dummyData';

const ReportItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'lost',
    images: [],
    category: '',
    location: '',
    description: '',
    canProveOwnership: false,
    contactInfo: '',
    title: '',
    secretCode: generateSecretCode()
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const categories = [
    'Electronics',
    'IDs',
    'Jewelry',
    'Clothing',
    'Books',
    'Other'
  ];

  // Check authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login', { state: { from: '/report' } });
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  // Add this with your other useState/useEffect hooks
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in demo mode - image uploads disabled');
    }
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const itemData = {
          ...formData,
          images: [], // In production, you'd upload images here
          status: formData.type === 'found' ? 'pending_verification' : formData.type,
          postedBy: {
            userId: auth.currentUser.uid,
            name: auth.currentUser.displayName || 'Anonymous',
            email: auth.currentUser.email || ''
          },
          createdAt: serverTimestamp(),
          verificationStatus: 'pending',
          trustScore: 0
        };
    
        // For found items, add additional verification fields
        if (formData.type === 'found') {
          itemData.foundTime = new Date().toISOString();
          itemData.verificationQuestions = [
            "What color is the item?",
            "Where exactly did you find it?",
            "When did you find it?",
            "Are there any distinctive features?"
          ];
        }
    
        const docRef = await addDoc(collection(db, "items"), itemData);
    
        // Notify admin for found items
        if (formData.type === 'found') {
          await addDoc(collection(db, "adminNotifications"), {
            type: 'verification_needed',
            itemId: docRef.id,
            title: formData.title,
            category: formData.category,
            createdAt: serverTimestamp()
          });
        }
    
        toast.success(`Item reported successfully! ${formData.type === 'found' ? 'Admin will verify it shortly.' : ''}`);
        navigate('/feed');
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to submit report');
      } finally {
        setLoading(false);
      }
    };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Only JPG, PNG, and GIF images are allowed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: files
    }));
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Report {formData.type === 'lost' ? 'Lost' : 'Found'} Item</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Item Type Toggle */}
                <div className="mb-3">
                  <label className="form-label">Item Type</label>
                  <div className="btn-group w-100">
                    <button
                      type="button"
                      className={`btn ${formData.type === 'lost' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'lost' }))}
                    >
                      Lost Item
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'found' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'found' }))}
                    >
                      Found Item
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <label className="form-label">Item Title*</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Brief description (e.g., 'Black wallet', 'iPhone 12')"
                  />
                </div>

                {/* Category */}
                <div className="mb-3">
                  <label className="form-label">Category*</label>
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <label className="form-label">
                    {formData.type === 'lost' ? 'Where did you lose it?' : 'Where was it found?'}*
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    maxLength={200}
                    placeholder="Example: Classroom 201, Main Library, Sports Ground, etc."
                  />
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">Description*</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    maxLength={500}
                    placeholder={`Provide detailed description of the ${formData.type === 'lost' ? 'lost' : 'found'} item...`}
                  />
                  <small className="text-muted">{500 - formData.description.length} characters remaining</small>
                </div>

                {/* Images */}
                <div className="mb-3">
                  <label className="form-label">Images (optional, max 5)</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    accept="image/jpeg, image/png, image/gif"
                    onChange={handleImageUpload}
                  />
                  {formData.images.length > 0 && (
                    <div className="mt-2">
                      <small>Selected files: {formData.images.map(img => img.name).join(', ')}</small>
                    </div>
                  )}
                  <small className="text-muted">Upload clear photos (JPEG, PNG, GIF)</small>
                </div>

                {/* Contact Info */}
                <div className="mb-3">
                  <label className="form-label">Contact Information*</label>
                  <input
                    type="text"
                    name="contactInfo"
                    className="form-control"
                    value={formData.contactInfo}
                    onChange={handleChange}
                    required
                    placeholder="How should people contact you? (Email/Phone)"
                  />
                </div>

                {/* Ownership Checkbox */}
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    name="canProveOwnership"
                    className="form-check-input"
                    checked={formData.canProveOwnership}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">
                    I can prove ownership of this item
                  </label>
                </div>

                {/* Submit Button */}
                <div className="text-center mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary px-5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportItem;