
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, doc, setDoc, getDoc, GoogleAuthProvider, signInWithPopup, signOut } from '@/lib/firebase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'owner' | 'vendor'; // Plus de "repairer" pour corriger l'erreur
  storeId?: string;
  hasCompletedSetup?: boolean;
}

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: 'owner' | 'vendor') => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  setUserRole: async () => {},
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: userData.role || 'owner', // Définir une valeur par défaut
            storeId: userData.storeId,
            hasCompletedSetup: userData.hasCompletedSetup,
          });
        } else {
          setCurrentUser({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'owner', // Définir une valeur par défaut pour corriger l'erreur TS
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const login = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userDoc.exists()) {
          setCurrentUser({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: userData.role || 'owner', // Définir une valeur par défaut
            storeId: userData.storeId,
            hasCompletedSetup: userData.hasCompletedSetup,
          });
        } else {
          setCurrentUser({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'owner', // Définir une valeur par défaut
          });
        }
        
        toast.success("Connexion réussie !");
        
        // Après la connexion réussie, si c'est un propriétaire, vérifier la configuration
        if (userData?.role === 'owner') {
          const companyDoc = await getDoc(doc(db, 'companies', user.uid));
          
          // Si l'entreprise n'est pas configurée, rediriger vers la page de configuration
          if (!companyDoc.exists() || !companyDoc.data()?.setupCompleted) {
            navigate('/owner/setup');
            return;
          }
        }
        
        if (userData?.role === 'vendor') {
          navigate('/vendor/dashboard');
          return;
        }
        
        navigate('/owner/dashboard');
      }
    } catch (error: any) {
      console.error("Erreur lors de la connexion :", error);
      toast.error("Erreur lors de la connexion : " + error.message);
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
  
  const setUserRole = async (role: 'owner' | 'vendor') => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Mettre à jour le rôle de l'utilisateur dans Firestore
      await setDoc(doc(db, 'users', currentUser.id), { role: role }, { merge: true });
      
      // Mettre à jour l'état local de l'utilisateur
      setCurrentUser({ ...currentUser, role: role });
      
      toast.success(`Votre rôle a été défini sur ${role}`);
    } catch (error: any) {
      console.error("Erreur lors de la définition du rôle de l'utilisateur :", error);
      toast.error("Erreur lors de la définition du rôle de l'utilisateur : " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const value: AuthContextProps = {
    currentUser,
    loading,
    login,
    logout,
    setUserRole,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
