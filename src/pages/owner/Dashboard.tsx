
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  Store, 
  Users, 
  Wrench, 
  Bell, 
  BarChart2,
  Package, 
  AlertCircle 
} from 'lucide-react';
import { db, collection, onSnapshot, query, where, orderBy } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Sale, Store as StoreType, RepairRequest, Notification as NotificationType } from '../../types';
import OwnerStores from '@/components/owner/OwnerStores';
import OwnerSales from '@/components/owner/OwnerSales';
import OwnerUsers from '@/components/owner/OwnerUsers';
import OwnerRepairs from '@/components/owner/OwnerRepairs';
import OwnerNotifications from '@/components/owner/OwnerNotifications';
import OwnerStats from '@/components/owner/OwnerStats';
import OwnerStock from '@/components/owner/OwnerStock';
import OwnerHeader from '@/components/owner/OwnerHeader';

const OwnerDashboard = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [salesCount, setSalesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [pendingRepairsCount, setPendingRepairsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch stores
    const unsubscribeStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      const storesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoreType));
      setStores(storesData);
    });
    
    // Fetch user count
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersCount(snapshot.docs.length);
    });
    
    // Fetch sales count
    const unsubscribeSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSalesCount(snapshot.docs.length);
      
      // Get recent sales
      const recent = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);
      setRecentSales(recent);
    });
    
    // Fetch pending repairs count
    const repairsQuery = query(
      collection(db, 'repairs'),
      where('status', 'in', ['pending', 'diagnosed'])
    );
    
    const unsubscribeRepairs = onSnapshot(repairsQuery, (snapshot) => {
      setPendingRepairsCount(snapshot.docs.length);
    });
    
    // Fetch low stock count - items with quantity < 5
    const unsubscribeLowStock = onSnapshot(collection(db, 'storeInventory'), (snapshot) => {
      const lowStock = snapshot.docs.filter(doc => doc.data().quantity < 5);
      setLowStockCount(lowStock.length);
    });
    
    return () => {
      unsubscribeStores();
      unsubscribeUsers();
      unsubscribeSales();
      unsubscribeRepairs();
      unsubscribeLowStock();
    };
    
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Store className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Boutiques</p>
                <h3 className="text-2xl font-bold">{stores.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <ShoppingBag className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ventes</p>
                <h3 className="text-2xl font-bold">{salesCount}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utilisateurs</p>
                <h3 className="text-2xl font-bold">{usersCount}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Stock bas</p>
                <h3 className="text-2xl font-bold">{lowStockCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="stores" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="h-4 w-4" /> Boutiques
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Ventes
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="repairs" className="flex items-center gap-2">
              <Tool className="h-4 w-4" /> Réparations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> 
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Statistiques
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Stocks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stores" className="p-0 border-none">
            <OwnerStores stores={stores} />
          </TabsContent>
          
          <TabsContent value="sales" className="p-0 border-none">
            <OwnerSales recentSales={recentSales} />
          </TabsContent>
          
          <TabsContent value="users" className="p-0 border-none">
            <OwnerUsers />
          </TabsContent>
          
          <TabsContent value="repairs" className="p-0 border-none">
            <OwnerRepairs pendingCount={pendingRepairsCount} />
          </TabsContent>
          
          <TabsContent value="notifications" className="p-0 border-none">
            <OwnerNotifications notifications={notifications} />
          </TabsContent>
          
          <TabsContent value="stats" className="p-0 border-none">
            <OwnerStats />
          </TabsContent>
          
          <TabsContent value="stock" className="p-0 border-none">
            <OwnerStock lowStockCount={lowStockCount} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;
