import { db } from '../firebase';
import { collection, addDoc, serverTimestamp,getDocs } from 'firebase/firestore';

export const generateSecretCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const dummyItems = [
  {
    type: 'lost',
    title: 'Lost iPhone 13 Pro',
    description: 'Black iPhone 13 Pro lost near Central Park.',
    category: 'Electronics',
    location: { name: 'Central Park', lat: 40.7829, lng: -73.9654 },
    geolocation: { lat: 40.7829, lng: -73.9654 }, // Add this for map functionality
    images: ['https://example.com/iphone.jpg'],
    canProveOwnership: true,
    contactInfo: 'email@example.com',
    secretCode: generateSecretCode(),
    status: 'lost',
    createdAt: serverTimestamp(),
    postedBy: {
      userId: 'dummy-user-1',
      name: 'John Doe'
    }
  },
  // Add more items...
];

export const addDummyData = async () => {
  try {
    // Check if items already exist to prevent duplicates
    const itemsSnapshot = await getDocs(collection(db, "items"));
    if (itemsSnapshot.size > 0) {
      console.log('Items already exist, skipping dummy data');
      return;
    }

    // Add dummy items
    for (const item of dummyItems) {
      await addDoc(collection(db, "items"), item);
    }
    console.log(`${dummyItems.length} dummy items added successfully`);
  } catch (error) {
    console.error("Error adding dummy data:", error);
    throw error; // Re-throw to handle in calling component
  }
};