
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db, doc, getDoc, signOut } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { User as UserType } from '../types';

interface AuthContextType {
  currentUser: UserType | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  loading: true,
  logout: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            email: user.email || '',
            role: userData.role,
            displayName: userData.displayName || user.displayName || '',
            storeId: userData.storeId,
            repairSpecialty: userData.repairSpecialty
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

  // Add logout function
  const logout = async () => {
    try {
      await signOut(auth);
      // No need to set currentUser to null here as the auth state change will trigger that
    } catch (error) {
      console.error("Failed to logout", error);
      throw error;
    }
  };

  const value = { currentUser, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
