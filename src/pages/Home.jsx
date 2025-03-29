import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import mainImage from '../assets/output.jpg';

const Home = () => {
  const user = auth.currentUser;

  return (
    <div className="container py-5">
      <div className="row align-items-center">
        <div className="col-lg-6">
          <h1 className="display-4 fw-bold mb-4">
            Welcome to <span className="text-primary">Findr</span>
          </h1>
          <p className="lead mb-4">
            Your trusted platform for finding lost items and connecting with their owners.
            Join our community and help others find what they've lost.
          </p>
          <div className="d-flex gap-3">
            <Link to="/feed" className="btn btn-primary btn-lg">
              <i className="bi bi-search me-2"></i>Browse Items
            </Link>
            {user ? (
              <Link to="/report" className="btn btn-outline-primary btn-lg">
                <i className="bi bi-plus-circle me-2"></i>Report Item
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline-primary btn-lg">
                <i className="bi bi-box-arrow-in-right me-2"></i>Sign In to Report
              </Link>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <img
            src={mainImage}
            alt="Findr Hero"
            className="img-fluid rounded shadow"
          />
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-4 text-primary mb-3">
                <i className="bi bi-search-heart"></i>
              </div>
              <h3 className="card-title">Find Lost Items</h3>
              <p className="card-text text-muted">
                Browse through our extensive collection of lost and found items.
                Your lost item might be just a click away.
              </p>
              <Link to="/feed" className="btn btn-outline-primary">
                Browse Items
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-4 text-primary mb-3">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3 className="card-title">Secure Verification</h3>
              <p className="card-text text-muted">
                Our verification system ensures items are returned to their rightful owners.
                Safe and secure item claiming process.
              </p>
              {user ? (
                <Link to="/report" className="btn btn-outline-primary">
                  Report an Item
                </Link>
              ) : (
                <Link to="/login" className="btn btn-outline-primary">
                  Sign In to Report
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-4 text-primary mb-3">
                <i className="bi bi-people"></i>
              </div>
              <h3 className="card-title">Community Driven</h3>
              <p className="card-text text-muted">
                Join our community of helpful individuals. Together, we can make a difference
                in helping people find their lost items.
              </p>
              <Link to="/register" className="btn btn-outline-primary">
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-12 text-center">
          <h2 className="mb-4">How Findr Works</h2>
          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-1-circle"></i>
                </div>
                <h4>Report Item</h4>
                <p className="text-muted">Submit details about your lost or found item</p>
                {user ? (
                  <Link to="/report" className="btn btn-sm btn-outline-primary">
                    Report Now
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-sm btn-outline-primary">
                    Sign In to Report
                  </Link>
                )}
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-2-circle"></i>
                </div>
                <h4>Get Listed</h4>
                <p className="text-muted">Your item appears in our searchable database</p>
                <Link to="/feed" className="btn btn-sm btn-outline-primary">
                  View Items
                </Link>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-3-circle"></i>
                </div>
                <h4>Connect</h4>
                <p className="text-muted">Get matched with potential owners or finders</p>
                <Link to="/feed" className="btn btn-sm btn-outline-primary">
                  Browse Items
                </Link>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-4-circle"></i>
                </div>
                <h4>Reunite</h4>
                <p className="text-muted">Successfully return items to their owners</p>
                <Link to="/feed" className="btn btn-sm btn-outline-primary">
                  View Success Stories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;