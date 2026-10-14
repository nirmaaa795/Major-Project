import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Real-time listener for an organization's keywords
 */
export const subscribeToOrgKeywords = (organizationId, callback, onError) => {
  if (!organizationId) return () => {};

  const keywordsRef = collection(db, 'organizations', organizationId, 'keywords');
  
  return onSnapshot(
    keywordsRef,
    (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(list);
    },
    (error) => {
      console.error(`Error listening to keywords for org [${organizationId}]:`, error);
      if (onError) onError(error);
    }
  );
};

/**
 * Add a keyword to an organization
 */
export const addOrgKeyword = async (organizationId, keyword, answer) => {
  const keywordsRef = collection(db, 'organizations', organizationId, 'keywords');
  return await addDoc(keywordsRef, {
    keyword: keyword.toLowerCase().trim(),
    answer: answer.trim(),
    createdAt: new Date().toISOString()
  });
};

/**
 * Delete a keyword from an organization
 */
export const deleteOrgKeyword = async (organizationId, keywordId) => {
  const docRef = doc(db, 'organizations', organizationId, 'keywords', keywordId);
  return await deleteDoc(docRef);
};