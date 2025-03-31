import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          {/* Left Section - About */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="mb-3">
              <i className="bi bi-search-heart-fill me-2"></i>
              Findr
            </h5>
            <p>
              Your trusted platform for finding lost items and connecting with their owners.
              Join our community and help others find what they've lost.
            </p>
          </div>

          {/* Middle Section - Quick Links */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-light text-decoration-none">
                  <i className="bi bi-house-door me-2"></i>Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/feed" className="text-light text-decoration-none">
                  <i className="bi bi-grid me-2"></i>Browse Items
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/report" className="text-light text-decoration-none">
                  <i className="bi bi-plus-circle me-2"></i>Report Item
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Section - Contact Info */}
          <div className="col-md-4">
            <h5 className="mb-3">Contact Us</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i>
                support@findr.com
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                +1 (555) 123-4567
              </li>
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                123 University Ave, Campus Town
              </li>
            </ul>

            {/* Social Media Icons */}
            <div className="mt-3">
              <a href="#" className="text-light me-3">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-light me-3">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-light me-3">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="text-light">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Horizontal Line */}
        <hr className="my-4 border-secondary" />

        {/* Copyright Section */}
        <div className="row">
          <div className="col-12 text-center">
          <p className="mb-0">Designed & Developed By Team RIT</p>
            <p className="mb-0">© {currentYear} Findr. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
