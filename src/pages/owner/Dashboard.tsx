
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
      });
      
      // Load recent sales
      const salesQuery = query(collection(db, 'sales'));
      const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Sale));
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
      
      // Count low stock items
      const inventoryQuery = query(collection(db, 'storeInventory'));
      const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
        const lowStockItems = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.quantity < (data.minQuantity || 5);
        });
        setLowStockCount(lowStockItems.length);
      });
      
      // Count pending repairs
      const repairsQuery = query(
        collection(db, 'repairs'),
        where('status', '==', 'pending')
      );
      
      const unsubscribeRepairs = onSnapshot(repairsQuery, (snapshot) => {
        setPendingRepairsCount(snapshot.docs.length);
      });
      
      // Initialize demo data
      const initDemoData = async () => {
        try {
          await seedDemoData(currentUser);
          toast.success("Données de démonstration initialisées avec succès");
        } catch (error) {
          console.error('Erreur lors du chargement des données de démo:', error);
        }
      };
      
      initDemoData();
      
      // Cleanup subscriptions
      return () => {
        unsubscribeStores();
        unsubscribeSales();
        unsubscribeNotifications();
        unsubscribeInventory();
        unsubscribeRepairs();
      };
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
