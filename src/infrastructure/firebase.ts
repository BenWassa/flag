import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public web config — safe to embed; access is enforced by Firestore/Auth rules, not by secrecy.
const firebaseConfig = {
  apiKey: 'AIzaSyAhbQTbybNxUbZyPAuAyfMKHRqA81b1_0k',
  authDomain: 'atlas-3c48a.firebaseapp.com',
  projectId: 'atlas-3c48a',
  storageBucket: 'atlas-3c48a.firebasestorage.app',
  messagingSenderId: '613715293447',
  appId: '1:613715293447:web:794ecaef2ae9b3fb5c81a2',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Named database: the enterprise-edition instance provisioned for this project is not "(default)".
export const firestore = getFirestore(app, 'atlas');

export function signInWithGoogle(): Promise<User> {
  return signInWithPopup(auth, new GoogleAuthProvider()).then((result) => result.user);
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function deleteSignedInUser(user: User): Promise<void> {
  return deleteUser(user);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
