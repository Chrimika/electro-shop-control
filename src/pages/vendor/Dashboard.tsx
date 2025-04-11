
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingBag, Users, Tool, AlertCircle, Bell, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { db, collection, onSnapshot, query, where, orderBy } from '../../lib/firebase';
import { Sale, RepairRequest, Customer } from '../../types';

const VendorDashboard = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [sales, setSales] = useState<Sale[]>([]);
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (!currentUser || !currentUser.storeId) return;
    
    // Charger les ventes récentes
    const salesQuery = query(
      collection(db, 'sales'),
      where('storeId', '==', currentUser.storeId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Sale));
      setSales(salesData);
    });
    
    // Charger les réparations en cours
    const repairsQuery = query(
      collection(db, 'repairs'),
      where('storeId', '==', currentUser.storeId),
      where('status', 'in', ['pending', 'diagnosed', 'repairing'])
    );
    
    const unsubscribeRepairs = onSnapshot(repairsQuery, (snapshot) => {
      const repairsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RepairRequest));
      setRepairs(repairsData);
    });
    
    // Charger les clients récents
    const customersQuery = query(
      collection(db, 'customers'),
      where('storeId', '==', currentUser.storeId)
    );
    
    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Customer));
      setCustomers(customersData);
    });
    
    return () => {
      unsubscribeSales();
      unsubscribeRepairs();
      unsubscribeCustomers();
    };
  }, [currentUser]);
  
  const filteredSales = sales.filter(sale => 
    (sale.customer?.name && sale.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.saleType.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getSaleTypeLabel = (type: string) => {
    switch(type) {
      case 'direct':
        return 'Vente directe';
      case 'installment':
        return 'Vente en tranches';
      case 'partialPaid':
        return '80% payé';
      case 'deliveredNotPaid':
        return 'Livré non payé';
      case 'trade':
        return 'Troc';
      default:
        return type;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <ShoppingBag className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ventes</p>
                <h3 className="text-2xl font-bold">{sales.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Clients</p>
                <h3 className="text-2xl font-bold">{customers.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Tool className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Réparations</p>
                <h3 className="text-2xl font-bold">{repairs.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Échéances proches</p>
                <h3 className="text-2xl font-bold">
                  {sales.filter(s => s.deadline && new Date(s.deadline) > new Date() && 
                    new Date(s.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000).length}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Sales */}
        <Card className="mb-8">
          <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <CardTitle>Ventes récentes</CardTitle>
              <CardDescription>Liste des dernières ventes enregistrées</CardDescription>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher une vente..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nouvelle vente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune vente trouvée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.slice(0, 5).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id.substring(0, 6)}</TableCell>
                      <TableCell>{sale.customer?.name || 'Client anonyme'}</TableCell>
                      <TableCell>{getSaleTypeLabel(sale.saleType)}</TableCell>
                      <TableCell className="text-right">{sale.totalAmount} €</TableCell>
                      <TableCell className="text-right">{sale.paidAmount} €</TableCell>
                      <TableCell>
                        <div className={`
                          px-2 py-1 rounded-full text-xs inline-flex items-center justify-center w-24
                          ${sale.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          ${sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${sale.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {sale.status === 'completed' && 'Complétée'}
                          {sale.status === 'pending' && 'En attente'}
                          {sale.status === 'cancelled' && 'Annulée'}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Détails</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {filteredSales.length > 5 && (
              <div className="flex justify-center mt-4">
                <Button variant="outline">Voir toutes les ventes</Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Repairs and Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Réparations en cours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tool className="h-5 w-5" /> Réparations en cours
              </CardTitle>
              <CardDescription>Statut des appareils en réparation</CardDescription>
            </CardHeader>
            <CardContent>
              {repairs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Aucune réparation en cours</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {repairs.slice(0, 3).map((repair) => (
                    <div key={repair.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{repair.deviceBrand} {repair.deviceModel}</h4>
                          <p className="text-sm text-gray-600 truncate">{repair.issueDescription}</p>
                        </div>
                        <Badge variant="outline" className={`
                          ${repair.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${repair.status === 'diagnosed' ? 'bg-blue-100 text-blue-800' : ''}
                          ${repair.status === 'repairing' ? 'bg-purple-100 text-purple-800' : ''}
                        `}>
                          {repair.status === 'pending' && 'En attente'}
                          {repair.status === 'diagnosed' && 'Diagnostiqué'}
                          {repair.status === 'repairing' && 'En réparation'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>Client: {repair.customerId}</span>
                        <span>Créé le: {new Date(repair.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {repairs.length > 3 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm">Voir toutes les réparations</Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>Dernières mises à jour importantes</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 4).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border rounded-lg ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                    >
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {notifications.length > 4 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm">Voir toutes les notifications</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
