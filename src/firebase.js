import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyAmdTfs7z__NmeKtFBEl3q891OEiFURUlQ",
      authDomain: "major-project-f56d1.firebaseapp.com",
      projectId: "major-project-f56d1",
      storageBucket: "major-project-f56d1.firebasestorage.app",
      messagingSenderId: "523168847962",
      appId: "1:523168847962:web:2be6252378e44eedc9a063",
      measurementId: "G-2F6X0EHH0C"
    };

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);