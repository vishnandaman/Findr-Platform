import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeModal = ({ itemId }) => {
  const [showModal, setShowModal] = useState(false);
  const qrValue = `${window.location.origin}/claim/${itemId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrValue)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Failed to copy link'));
  };

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        style={{ cursor: 'pointer' }}
        className="d-flex flex-column align-items-center"
      >
        <QRCodeSVG
          value={qrValue}
          size={80}
          level="H"
          includeMargin={true}
          className="border p-2"
        />
        <small className="text-muted mt-1">Click to enlarge</small>
      </div>

      {/* Modal for enlarged QR */}
      <div 
        className={`modal fade ${showModal ? 'show' : ''}`}
        style={{ display: showModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
        tabIndex="-1"
        onClick={() => setShowModal(false)}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Item QR Code</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body text-center">
              <QRCodeSVG
                value={qrValue}
                size={256}
                level="H"
                includeMargin={true}
              />
              <p className="mt-3">Scan this code to claim this item</p>
              <div className="input-group mt-3">
                <input
                  type="text"
                  className="form-control"
                  value={qrValue}
                  readOnly
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleCopyLink}
                >
                  Copy Link
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

QRCodeModal.propTypes = {
  itemId: PropTypes.string.isRequired
};

export default QRCodeModal;