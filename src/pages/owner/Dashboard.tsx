
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Store as StoreIcon, 
  ShoppingBag, 
  Package, 
  Wrench, 
  Bell,
  Users,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const OwnerDashboard = () => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [pendingRepairsCount, setPendingRepairsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoDataInitialized, setDemoDataInitialized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const isMobile = useIsMobile();
  
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
  
  const getActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <OwnerStats />;
      case 'stores':
        return <OwnerStores stores={stores} />;
      case 'sales':
        return <OwnerSales recentSales={recentSales} />;
      case 'stock':
        return <OwnerStock lowStockCount={lowStockCount} />;
      case 'repairs':
        return <OwnerRepairs pendingCount={pendingRepairsCount} />;
      case 'users':
        return <OwnerUsers />;
      case 'notifications':
        return <OwnerNotifications notifications={notifications} />;
      default:
        return <OwnerStats />;
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
  
  // Vue pour mobile: navigation par onglets
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-100">
        <OwnerHeader />
        
        <main className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
                <span className="sr-only">Rechercher</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setActiveTab('notifications')}>
                <Bell className="h-4 w-4" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Card className={`cursor-pointer border-2 ${activeTab === 'overview' ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveTab('overview')}>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <LayoutDashboard className="h-6 w-6 mb-1 text-blue-600" />
                <span className="text-sm font-medium">Vue générale</span>
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${activeTab === 'sales' ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveTab('sales')}>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <ShoppingBag className="h-6 w-6 mb-1 text-green-600" />
                <span className="text-sm font-medium">Ventes</span>
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${activeTab === 'stock' ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveTab('stock')}>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <Package className="h-6 w-6 mb-1 text-yellow-600" />
                <span className="text-sm font-medium">Stock</span>
                {lowStockCount > 0 && <span className="text-xs text-red-500">{lowStockCount} alerte(s)</span>}
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${activeTab === 'repairs' ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveTab('repairs')}>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <Wrench className="h-6 w-6 mb-1 text-purple-600" />
                <span className="text-sm font-medium">Réparations</span>
                {pendingRepairsCount > 0 && <span className="text-xs text-amber-500">{pendingRepairsCount} en attente</span>}
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${activeTab === 'stores' ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveTab('stores')}>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <StoreIcon className="h-6 w-6 mb-1 text-indigo-600" />
                <span className="text-sm font-medium">Boutiques</span>
                <span className="text-xs text-gray-500">{stores.length}</span>
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${activeTab === 'users' ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setActiveTab('users')}>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <Users className="h-6 w-6 mb-1 text-orange-600" />
                <span className="text-sm font-medium">Utilisateurs</span>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            {getActiveComponent()}
          </div>
        </main>
      </div>
    );
  }
  
  // Vue pour desktop: panneau latéral et contenu principal
  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Panneau latéral - Navigation desktop */}
          <aside className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border shadow-sm p-4 sticky top-24">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input placeholder="Rechercher..." className="pl-8" />
                </div>
              </div>
              
              <nav>
                <ul className="space-y-1">
                  <li>
                    <Button 
                      variant={activeTab === 'overview' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('overview')}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Vue générale
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeTab === 'sales' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('sales')}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Ventes
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeTab === 'stock' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('stock')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Stock
                      {lowStockCount > 0 && (
                        <span className="ml-auto bg-red-100 text-red-800 text-xs py-0.5 px-1.5 rounded-full">
                          {lowStockCount}
                        </span>
                      )}
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeTab === 'repairs' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('repairs')}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Réparations
                      {pendingRepairsCount > 0 && (
                        <span className="ml-auto bg-amber-100 text-amber-800 text-xs py-0.5 px-1.5 rounded-full">
                          {pendingRepairsCount}
                        </span>
                      )}
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeTab === 'stores' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('stores')}
                    >
                      <StoreIcon className="h-4 w-4 mr-2" />
                      Boutiques
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeTab === 'users' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Utilisateurs
                    </Button>
                  </li>
                  <li>
                    <Button 
                      variant={activeTab === 'notifications' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('notifications')}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs py-0.5 px-1.5 rounded-full">
                          {notifications.filter(n => !n.isRead).length}
                        </span>
                      )}
                    </Button>
                  </li>
                </ul>
              </nav>
              
              <div className="mt-6 pt-6 border-t">
                <Button className="w-full" asChild>
                  <a href="/owner/sales/new">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Nouvelle vente
                  </a>
                </Button>
              </div>
            </div>
          </aside>
          
          {/* Contenu principal */}
          <div className="flex-grow">
            {getActiveComponent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
