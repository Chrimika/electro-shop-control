
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, doc, setDoc, getDoc, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '@/lib/firebase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'owner' | 'vendor' | 'repairer';
  storeId?: string;
  repairSpecialty?: string;
  hasCompletedSetup?: boolean;
}

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role: 'owner' | 'vendor' | 'repairer') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            email: user.email,
            displayName: userData.displayName || user.displayName,
            role: userData.role || 'owner',
            storeId: userData.storeId,
            repairSpecialty: userData.repairSpecialty,
            hasCompletedSetup: userData.hasCompletedSetup,
          });
        } else {
          setCurrentUser({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'owner',
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Connexion réussie !");
    } catch (error: any) {
      console.error("Erreur lors de la connexion :", error);
      toast.error("Erreur lors de la connexion : " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (email: string, name: string, password: string, role: 'owner' | 'vendor' | 'repairer') => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document with role
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName: name,
        role,
        createdAt: new Date()
      });
      
      toast.success("Compte créé avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de l'inscription :", error);
      toast.error("Erreur lors de l'inscription : " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setCurrentUser(null);
      toast.success("Déconnexion réussie !");
      navigate('/login');
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion :", error);
      toast.error("Erreur lors de la déconnexion : " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const value: AuthContextProps = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
