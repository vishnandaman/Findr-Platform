import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Redirect to the page user tried to visit or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="auth-container">
      <div className={`auth-wrapper ${isLogin ? 'login-active' : 'register-active'}`}>
        {/* Login Form */}
        <div className="auth-form login-form">
          <h2>Welcome to Findr</h2>
          <p className="text-muted">Sign in to your account</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          <p className="mt-3 text-center">
            Don't have an account?{' '}
            <button className="btn btn-link" onClick={toggleForm}>
              Register here
            </button>
          </p>
        </div>

        {/* Register Form */}
        <div className="auth-form register-form">
          <h2>Join Findr</h2>
          <p className="text-muted">Create your account today</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Register'}
            </button>
          </form>
          <p className="mt-3 text-center">
            Already have an account?{' '}
            <button className="btn btn-link" onClick={toggleForm}>
              Login here
            </button>
          </p>
        </div>

        {/* Sliding Panel */}
        <div className="auth-panel">
          <div className="panel-content">
            <h2>{isLogin ? 'New to Findr?' : 'Welcome back!'}</h2>
            <p>
              {isLogin
                ? 'Join our community and start finding your lost items'
                : 'Already have an account? Sign in to continue'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 