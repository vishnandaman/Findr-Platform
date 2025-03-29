import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/report');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <h2 className="mb-4">Welcome to Lost & Found Portal</h2>
          <p className="mb-4">Please sign in to report or search for items</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGoogleSignIn}
          >
            <i className="bi bi-google me-2"></i>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;