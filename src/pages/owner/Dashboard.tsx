
import React, { useEffect } from 'react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import OwnerStats from '@/components/owner/OwnerStats';
import OwnerStores from '@/components/owner/OwnerStores';
import OwnerSales from '@/components/owner/OwnerSales';
import OwnerStock from '@/components/owner/OwnerStock';
import OwnerUsers from '@/components/owner/OwnerUsers';
import OwnerRepairs from '@/components/owner/OwnerRepairs';
import OwnerNotifications from '@/components/owner/OwnerNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { seedDemoData } from '@/utils/seedDemoData';
import { toast } from 'sonner';

const OwnerDashboard = () => {
  const { currentUser } = useAuth();
  
  useEffect(() => {
    // Essayer de générer des données de démo au chargement du tableau de bord
    if (currentUser) {
      const initDemoData = async () => {
        try {
          await seedDemoData(currentUser);
        } catch (error) {
          console.error('Erreur lors du chargement des données de démo:', error);
        }
      };
      
      initDemoData();
    }
  }, [currentUser]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <OwnerStats />
            <OwnerSales />
            <OwnerStock />
          </div>
          
          <div className="space-y-8">
            <OwnerNotifications />
            <OwnerStores />
            <OwnerUsers />
            <OwnerRepairs />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
