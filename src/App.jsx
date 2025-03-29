import React, { useEffect } from 'react'; // Added useEffect import here
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth,db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { devAutoInitAdmin } from './firebase/adminInit';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginForm from './components/LoginForm';
import Register from './components/Register';
import ReportItem from './pages/ReportItem';
import LostItemsFeed from './components/LostItemsFeed';
import ClaimItem from './pages/ClaimItem';
import UserProfile from './pages/UserProfile';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  // Check if user is admin (replace with actual Firestore check in production)
  const isAdmin = user.email === 'admin@lostfound.local' || 
                 (user.isAdmin === true);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const [user, loading] = useAuthState(auth);

  // Initialize admin in development
  useEffect(() => {
    devAutoInitAdmin();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar user={user} />
        <main className="flex-grow-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<LostItemsFeed />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />


            {/* Protected User Routes */}
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claim/:id"
              element={
                <ProtectedRoute>
                  <ClaimItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<AdminDashboard />} />


  <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;