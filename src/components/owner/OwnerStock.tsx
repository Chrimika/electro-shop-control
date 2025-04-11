
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  ShoppingBag, 
  BarChart, 
  FileBarChart 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { db, collection, onSnapshot } from '../../lib/firebase';

interface OwnerStockProps {
  lowStockCount: number;
}

interface StockItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  minQuantity: number;
  storeId: string;
  storeName: string;
  lastUpdated: Date;
}

const OwnerStock: React.FC<OwnerStockProps> = ({ lowStockCount }) => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    
    // Simulation de chargement de données depuis Firestore
    const unsubscribe = onSnapshot(collection(db, 'storeInventory'), (snapshot) => {
      // Dans une implémentation réelle, nous ferions des jointures ou des requêtes supplémentaires
      // pour obtenir toutes les informations nécessaires
      const stockData = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          productId: doc.data().productId || '',
          productName: doc.data().productName || 'Produit inconnu', // Devrait venir d'une jointure
          category: doc.data().category || 'Sans catégorie',
          quantity: doc.data().quantity || 0,
          minQuantity: doc.data().minQuantity || 5,
          storeId: doc.data().storeId || '',
          storeName: doc.data().storeName || 'Boutique inconnue', // Devrait venir d'une jointure
          lastUpdated: doc.data().updatedAt ? new Date(doc.data().updatedAt.toDate()) : new Date()
        };
      });
      
      setStock(stockData);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const filteredStock = stock.filter(item => 
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (quantity < minQuantity) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Stock bas</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">En stock</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inventaire</h2>
          <p className="text-gray-500">Gérez votre stock à travers toutes les boutiques</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" /> Rapport
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nouveau produit
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Package className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Produits uniques</p>
              <h3 className="text-2xl font-bold">{stock.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Stock bas</p>
              <h3 className="text-2xl font-bold">{lowStockCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <ShoppingBag className="h-6 w-6 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ruptures de stock</p>
              <h3 className="text-2xl font-bold">{stock.filter(item => item.quantity <= 0).length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-500" /> Inventaire
          </CardTitle>
          <CardDescription>Vue d'ensemble de tous les produits en stock</CardDescription>
          
          <div className="mt-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher un produit, une catégorie ou une boutique..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement de l'inventaire...</p>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Aucun produit trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.storeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.quantity}</span>
                        <Progress 
                          value={(item.quantity / (item.minQuantity * 2)) * 100} 
                          className="h-2 w-20"
                          color={
                            item.quantity <= 0 
                              ? 'bg-red-500' 
                              : item.quantity < item.minQuantity 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getStockStatus(item.quantity, item.minQuantity)}</TableCell>
                    <TableCell>{item.lastUpdated.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerStock;
