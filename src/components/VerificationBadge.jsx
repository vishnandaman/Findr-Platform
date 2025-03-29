import React from 'react';

const VerificationBadge = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'verified':
        return 'bg-success';
      case 'pending_verification':
        return 'bg-warning';
      case 'rejected':
        return 'bg-danger';
      case 'found':
        return 'bg-info';
      case 'lost':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending_verification':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'found':
        return 'Found';
      case 'lost':
        return 'Lost';
      default:
        return status;
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {getStatusText()}
    </span>
  );
};

export default VerificationBadge;