
import React, { useEffect, useState } from 'react';
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
import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot 
} from '@/lib/firebase';
import { Store, Sale, Notification } from '@/types';

const OwnerDashboard = () => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [pendingRepairsCount, setPendingRepairsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoDataInitialized, setDemoDataInitialized] = useState<boolean>(false);
  
  // Load data when component mounts
  useEffect(() => {
    if (currentUser) {
      // Load stores
      const storesQuery = query(
        collection(db, 'stores'), 
        where('ownerId', '==', currentUser.id)
      );
      
      const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
        const storesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Store));
        setStores(storesData);
        
        if (!demoDataInitialized && storesData.length === 0) {
          // Initialize demo data if no stores exist
          initDemoData();
          setDemoDataInitialized(true);
        }
      });
      
      // Load recent sales for this owner's stores
      const unsubscribeSales = onSnapshot(query(collection(db, 'sales')), (snapshot) => {
        const salesData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          } as Sale))
          .filter(sale => {
            // Filter sales from stores owned by current user
            return stores.some(store => store.id === sale.storeId);
          });
          
        setRecentSales(salesData);
      });
      
      // Load notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.id)
      );
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Notification));
        setNotifications(notificationsData);
      });
      
      // Count low stock items for this owner's stores
      const unsubscribeInventory = onSnapshot(query(collection(db, 'storeInventory')), (snapshot) => {
        const lowStockItems = snapshot.docs.filter(doc => {
          const data = doc.data();
          // Only count inventory items from stores owned by this user
          const belongsToOwner = stores.some(store => store.id === data.storeId);
          return belongsToOwner && data.quantity < (data.minQuantity || 5);
        });
        setLowStockCount(lowStockItems.length);
      });
      
      // Count pending repairs
      const repairsQuery = query(
        collection(db, 'repairs'),
        where('status', '==', 'pending')
      );
      
      const unsubscribeRepairs = onSnapshot(repairsQuery, (snapshot) => {
        const repairsData = snapshot.docs.filter(doc => {
          const data = doc.data();
          // Filter repairs for this owner's stores
          return stores.some(store => store.id === data.storeId);
        });
        setPendingRepairsCount(repairsData.length);
      });
      
      setIsLoading(false);
      
      // Cleanup subscriptions
      return () => {
        unsubscribeStores();
        unsubscribeSales();
        unsubscribeNotifications();
        unsubscribeInventory();
        unsubscribeRepairs();
      };
    }
  }, [currentUser, stores]);
  
  // Initialize demo data
  const initDemoData = async () => {
    try {
      if (!currentUser) return;
      
      await seedDemoData(currentUser);
      toast.success("Données de démonstration initialisées avec succès");
    } catch (error) {
      console.error('Erreur lors du chargement des données de démo:', error);
      toast.error("Erreur lors de l'initialisation des données de démonstration");
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <OwnerHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement des données...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <OwnerStats />
            <OwnerSales recentSales={recentSales} />
            <OwnerStock lowStockCount={lowStockCount} />
          </div>
          
          <div className="space-y-8">
            <OwnerNotifications notifications={notifications} />
            <OwnerStores stores={stores} />
            <OwnerUsers />
            <OwnerRepairs pendingCount={pendingRepairsCount} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
