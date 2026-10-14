import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetch organization ID for authenticated admin user from users/{uid}
 */
export const getUserOrganizationId = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return userSnap.data().organizationId;
    } else {
      // Fallback: If no user doc exists yet, default org ID to user's UID
      const defaultOrgId = uid;
      await setDoc(userDocRef, {
        organizationId: defaultOrgId,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      return defaultOrgId;
    }
  } catch (error) {
    console.error("Error fetching user organization ID:", error);
    throw error;
  }
};

/**
 * Subscribe to Organization Settings (companyName, botName, whatsappNumber, etc.)
 */
export const subscribeToOrgSettings = (organizationId, callback) => {
  if (!organizationId) return () => { };

  const settingsRef = doc(db, 'organizations', organizationId, 'config', 'settings');
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        // Fallback in-memory defaults without writing to Firestore
        callback({
          companyName: 'Match-Bot',
          botName: 'Match-Bot',
          welcomeMessage: 'Greetings agent. How can I assist you?',
          whatsappNumber: '1234567890',
          themeColor: '#39FF14'
        });
      }
    },
    (error) => {
      console.error(`Error subscribing to settings for org [${organizationId}]:`, error);
    }
  );
};

/**
 * Update Organization Settings
 */
export const updateOrgSettings = async (organizationId, newSettings) => {
  const settingsRef = doc(db, 'organizations', organizationId, 'config', 'settings');
  await setDoc(settingsRef, newSettings, { merge: true });
};