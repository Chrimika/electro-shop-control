
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import VendorHeader from '@/components/vendor/VendorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { db, collection, query, where, getDocs, orderBy } from '@/lib/firebase';
import { Sale } from '@/types';
import { fr } from 'date-fns/locale';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Sales = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const fetchSales = async () => {
      if (!currentUser?.storeId) return;
      
      try {
        setLoading(true);
        
        const salesQuery = query(
          collection(db, 'sales'),
          where('storeId', '==', currentUser.storeId),
          orderBy('createdAt', 'desc')
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure createdAt is properly converted to Date
          let createdAtDate: Date;
          
          // Handle different types of createdAt data
          if (data.createdAt && typeof data.createdAt === 'object') {
            // Firestore Timestamp type has a toDate method
            if ('toDate' in data.createdAt && typeof data.createdAt.toDate === 'function') {
              createdAtDate = data.createdAt.toDate();
            } else {
              // If it's already a Date object
              createdAtDate = data.createdAt as Date;
            }
          } else {
            // Fallback to current date if createdAt is missing or invalid
            createdAtDate = new Date();
          }
              
          return {
            id: doc.id,
            ...data,
            createdAt: createdAtDate
          } as Sale;
        });
        
        setSales(salesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales:', error);
        setLoading(false);
      }
    };
    
    fetchSales();
  }, [currentUser]);
  
  const toggleSort = (field: 'date' | 'amount') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const filteredSales = sales.filter(sale => {
    const customerName = sale.customer?.name || '';
    const totalAmount = sale.totalAmount.toString();
    
    return (
      customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      totalAmount.includes(searchText)
    );
  });
  
  const sortedSales = [...filteredSales].sort((a, b) => {
    if (sortField === 'date') {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return sortDirection === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    } else {
      return sortDirection === 'asc'
        ? a.totalAmount - b.totalAmount
        : b.totalAmount - a.totalAmount;
    }
  });
  
  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Ventes</h1>
          <Button onClick={() => navigate('/vendor/sales/new')}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle vente
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Rechercher par client ou montant..."
                className="pl-8"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortField === 'date' ? 'default' : 'outline'}
                onClick={() => toggleSort('date')}
                size="sm"
                className="flex gap-1 items-center"
              >
                Date
                {sortField === 'date' && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortField === 'amount' ? 'default' : 'outline'}
                onClick={() => toggleSort('amount')}
                size="sm"
                className="flex gap-1 items-center"
              >
                Montant
                {sortField === 'amount' && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : sortedSales.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 text-center">
                    {searchText ? "Aucune vente ne correspond à votre recherche" : "Aucune vente enregistrée"}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/vendor/sales/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Créer une vente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSales.map((sale) => {
                  // Safely handle date conversion
                  let saleDate: Date;
                  if (sale.createdAt instanceof Date) {
                    saleDate = sale.createdAt;
                  } else if (sale.createdAt && typeof sale.createdAt === 'object' && 'toDate' in sale.createdAt) {
                    // This is for Firestore Timestamp objects
                    saleDate = (sale.createdAt as any).toDate();
                  } else {
                    // Fallback
                    saleDate = new Date(sale.createdAt || Date.now());
                  }
                  
                  return (
                    <Card
                      key={sale.id}
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/vendor/sales/${sale.id}`)}
                    >
                      <div className={`h-2 ${sale.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {format(saleDate, 'PPP', { locale: fr })}
                          </CardTitle>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sale.status === 'completed' ? 'Terminée' : 'En attente'}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(saleDate, 'HH:mm')}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Client:</span>
                          <span className="font-medium">{sale.customer?.name || 'Client anonyme'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="font-medium">
                            {sale.saleType === 'direct' && 'Directe'}
                            {sale.saleType === 'installment' && 'Par tranches'}
                            {sale.saleType === 'partialPaid' && 'Partiellement payée'}
                            {sale.saleType === 'deliveredNotPaid' && 'Livré non payé'}
                            {sale.saleType === 'trade' && 'Troc'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Articles:</span>
                          <span className="font-medium">{sale.items.length}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-gray-500">Montant total:</span>
                          <span className="text-lg font-bold">{sale.totalAmount} FCFA</span>
                        </div>
                        {sale.paidAmount < sale.totalAmount && (
                          <div className="flex justify-between text-amber-600">
                            <span>Reste à payer:</span>
                            <span className="font-semibold">{sale.totalAmount - sale.paidAmount} FCFA</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {/* Same content as "all" but filtered */}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            {/* Same content as "all" but filtered */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Sales;
