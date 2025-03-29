// src/components/AdminLogin.jsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [email, setEmail] = useState('admin@lostfound.local');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard'); // Redirect immediately after successful login
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h3><i className="bi bi-shield-lock me-2"></i>Admin Login</h3>
                {process.env.NODE_ENV === 'development' && (
                  <span className="badge bg-warning">DEV MODE</span>
                )}
              </div>
            </div>
            <div className="card-body">
              {process.env.NODE_ENV === 'development' && (
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  Using development credentials
                </div>
              )}
              
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login as Admin'
                  )}
                </button>
              </form>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="card-footer text-muted small">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Development credentials: admin@lostfound.local / admin123
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;