
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyInfo } from '@/types/company';

export const useCompanyInfo = (redirectIfNotSetup = false, excludeRoutes: string[] = []) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est un propriétaire (owner)
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        const userData = userDoc.data();
        
        // Si l'utilisateur n'est pas un propriétaire, ne pas vérifier la configuration
        if (userData?.role !== 'owner') {
          setLoading(false);
          return;
        }
        
        const companyDoc = await getDoc(doc(db, 'companies', currentUser.id));
        
        if (companyDoc.exists()) {
          const companyData = companyDoc.data() as CompanyInfo;
          setCompanyInfo(companyData);
          
          // Rediriger vers la page de configuration si nécessaire
          if (redirectIfNotSetup && !companyData.setupCompleted) {
            // Vérifier si la route actuelle est exclue de la redirection
            const currentPath = window.location.pathname;
            const isExcludedRoute = excludeRoutes.some(route => currentPath.includes(route));
            
            if (!isExcludedRoute && !currentPath.includes('/owner/setup')) {
              navigate('/owner/setup');
            }
          }
        } else if (redirectIfNotSetup) {
          // Si aucune donnée d'entreprise n'existe et que la redirection est activée
          const currentPath = window.location.pathname;
          const isExcludedRoute = excludeRoutes.some(route => currentPath.includes(route));
          
          if (!isExcludedRoute && !currentPath.includes('/owner/setup')) {
            navigate('/owner/setup');
          }
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [currentUser, navigate, redirectIfNotSetup, excludeRoutes]);

  return { companyInfo, loading, setCompanyInfo };
};
