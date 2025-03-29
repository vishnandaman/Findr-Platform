import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-search-heart-fill me-2"></i>
          Findr
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="bi bi-house-door me-1"></i>Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/feed">
                <i className="bi bi-grid me-1"></i>Browse Items
              </Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/report">
                  <i className="bi bi-plus-circle me-1"></i>Report Item
                </Link>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/profile">
                  <i className="bi bi-person me-1"></i>My Profile
                </Link>
              </li>
            )}
            {user?.email === 'admin@example.com' && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  <i className="bi bi-shield-lock me-1"></i>Admin
                </Link>
              </li>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item dropdown">
                <button
                  className="btn btn-link nav-link dropdown-toggle d-flex align-items-center"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="d-flex align-items-center">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="rounded-circle me-2"
                        style={{ width: '32px', height: '32px', border: '2px solid var(--border-color)' }}
                      />
                    ) : (
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: '32px', height: '32px' }}>
                        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="d-none d-md-inline text-primary">{user.displayName || 'User'}</span>
                  </div>
                </button>
                <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${showDropdown ? 'show' : ''}`} aria-labelledby="userDropdown">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person-circle me-2"></i>My Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/feed">
                      <i className="bi bi-grid me-2"></i>My Items
                    </Link>
                  </li>
                  {user?.email === 'admin@example.com' && (
                    <li>
                      <Link className="dropdown-item" to="/admin">
                        <i className="bi bi-shield-lock me-2"></i>Admin Dashboard
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    <i className="bi bi-person-plus me-1"></i>Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;