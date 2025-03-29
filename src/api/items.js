// src/api/items.js
import { 
    db, 
    storage 
  } from '../firebase';
  import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from 'react-query';
  import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy
  } from 'firebase/firestore';
  import { 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
  } from 'firebase/storage';
  
  // Get all items
  export const useItems = (filters = {}) => {
    return useQuery(['items', filters], async () => {
      let q = collection(db, 'items');
      
      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      q = query(q, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  };
  
  // Create new item
  export const useCreateItem = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
      async ({ itemData, images }) => {
        // Upload images if they exist
        const imageUrls = [];
        if (images && images.length > 0) {
          await Promise.all(
            images.map(async (image) => {
              const storageRef = ref(storage, `items/${Date.now()}_${image.name}`);
              await uploadBytes(storageRef, image);
              const url = await getDownloadURL(storageRef);
              imageUrls.push(url);
            })
          );
        }
        
        const docRef = await addDoc(collection(db, 'items'), {
          ...itemData,
          images: imageUrls,
          createdAt: new Date().toISOString()
        });
        
        return { id: docRef.id, ...itemData, images: imageUrls };
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('items');
        }
      }
    );
  };
  
  // Update item
  export const useUpdateItem = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
      async ({ id, updates }) => {
        await updateDoc(doc(db, 'items', id), {
          ...updates,
          updatedAt: new Date().toISOString()
        });
        return { id, ...updates };
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('items');
        }
      }
    );
  };
  
  // Delete item
  export const useDeleteItem = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
      async (id) => {
        // Optional: Delete associated images
        const itemDoc = await getDoc(doc(db, 'items', id));
        if (itemDoc.exists()) {
          const { images } = itemDoc.data();
          if (images && images.length > 0) {
            await Promise.all(
              images.map(async (url) => {
                const storageRef = ref(storage, url);
                await deleteObject(storageRef).catch(console.error);
              })
            );
          }
        }
        
        await deleteDoc(doc(db, 'items', id));
        return id;
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries('items');
        }
      }
    );
  };
  
  // Get single item
  export const useItem = (id) => {
    return useQuery(['item', id], async () => {
      const docSnap = await getDoc(doc(db, 'items', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    });
  };