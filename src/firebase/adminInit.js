import { auth, db } from '../firebase'; // Correct relative path
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

const ADMIN_CREDS = {
  email: 'admin@lostfound.local',
  password: 'admin123',
  name: 'System Admin'
};

export const initializeAdmin = async () => {
  try {
    // Check if any admin exists by looking for users with isAdmin=true
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('isAdmin', '==', true))
    );
    
    if (!usersSnapshot.empty) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_CREDS.email,
      ADMIN_CREDS.password
    );

    // Set admin user document with additional security flags
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name: ADMIN_CREDS.name,
      email: ADMIN_CREDS.email,
      isAdmin: true,
      isSystemAdmin: true, // Special flag for initial admin
      createdAt: new Date(),
      lastLogin: null,
      permissions: {
        canManageUsers: true,
        canVerifyItems: true,
        canManageContent: true
      }
    });

    // Create admin backup record
    await setDoc(doc(db, 'adminBackup', 'initialAdmin'), {
      email: ADMIN_CREDS.email,
      uid: userCredential.user.uid,
      setupDate: new Date(),
      resetToken: null
    });

    console.log('✅ Admin user created successfully');
    return true;
  } catch (error) {
    console.error('❌ Admin initialization failed:', error);
    return false;
  }
};

// Development-only auto-init function
export const devAutoInitAdmin = async () => {
  if (process.env.NODE_ENV === 'development') {
    const success = await initializeAdmin();
    if (success) {
      console.log('Development admin ready - email: admin@lostfound.local, password: admin123');
    }
  }
};