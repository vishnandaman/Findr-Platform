import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

const Notifications = ({ userId, isAdmin = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionName = isAdmin ? 'adminNotifications' : 'userNotifications';
    const q = query(
      collection(db, collectionName),
      where(isAdmin ? 'status' : 'userId', '==', isAdmin ? 'pending' : userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, isAdmin]);

  const markAsRead = async (notificationId) => {
    try {
      const collectionName = isAdmin ? 'adminNotifications' : 'userNotifications';
      await updateDoc(doc(db, collectionName, notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleAdminAction = async (notificationId, action) => {
    try {
      await updateDoc(doc(db, 'adminNotifications', notificationId), {
        status: action,
        resolvedAt: new Date(),
        resolvedBy: userId
      });
      toast.success(`Notification ${action}`);
    } catch (error) {
      console.error("Error handling admin action:", error);
      toast.error("Failed to process action");
    }
  };

  if (loading) {
    return <div className="spinner-border text-primary" role="status" />;
  }

  return (
    <div className="notifications-container">
      <h4>{isAdmin ? 'Admin' : 'Your'} Notifications</h4>
      
      {notifications.length === 0 ? (
        <div className="alert alert-info">No new notifications</div>
      ) : (
        <div className="list-group">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`list-group-item ${notif.read ? '' : 'list-group-item-primary'}`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="d-flex justify-content-between">
                <div>
                  <h6>{notif.title || notif.message}</h6>
                  <small className="text-muted">
                    {new Date(notif.createdAt?.toDate()).toLocaleString()}
                  </small>
                </div>
                {isAdmin && notif.status === 'pending' && (
                  <div>
                    <button 
                      className="btn btn-sm btn-success me-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdminAction(notif.id, 'approved');
                      }}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdminAction(notif.id, 'rejected');
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;