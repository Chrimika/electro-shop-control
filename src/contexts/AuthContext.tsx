
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db, doc, getDoc } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type UserRole = 'owner' | 'vendor' | 'repairer' | null;

interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  storeId?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: user.uid,
            email: user.email || '',
            role: userData.role,
            displayName: userData.displayName || user.displayName || '',
            storeId: userData.storeId
          });
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { currentUser, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
