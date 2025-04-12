
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Package,
  Search,
  Plus,
  Store,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { db, collection, getDocs, query, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from '../../lib/firebase';
import { Product, Store as StoreType, StoreInventory } from '../../types';
import { toast } from 'sonner';

const StockManagement = () => {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Map<string, Map<string, number>>>(new Map());
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Dialog states
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (products.length > 0) {
      applyFilters();
    }
  }, [searchQuery, products, selectedStore]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stores
      const storesQuery = query(collection(db, 'stores'));
      const storesSnapshot = await getDocs(storesQuery);
      const storesData = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoreType));
      setStores(storesData);
      
      if (storesData.length > 0 && !selectedStore) {
        setSelectedStore(storesData[0].id);
      }
      
      // Fetch products
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Product));
      setProducts(productsData);
      
      // Fetch inventory
      const inventoryQuery = query(collection(db, 'storeInventory'));
      const inventorySnapshot = await getDocs(inventoryQuery);
      
      const invMap = new Map<string, Map<string, number>>();
      
      inventorySnapshot.docs.forEach(doc => {
        const data = doc.data() as StoreInventory;
        if (!invMap.has(data.storeId)) {
          invMap.set(data.storeId, new Map<string, number>());
        }
        invMap.get(data.storeId)?.set(data.productId, data.quantity);
      });
      
      setInventory(invMap);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...products];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.supplier.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  };
  
  const getProductQuantity = (productId: string, storeId: string): number => {
    return inventory.get(storeId)?.get(productId) || 0;
  };
  
  const handleUpdateStock = async () => {
    if (!currentProduct || !selectedStore) return;
    
    try {
      setIsSubmitting(true);
      
      const inventoryDocId = `${selectedStore}_${currentProduct.id}`;
      const inventoryRef = doc(db, 'storeInventory', inventoryDocId);
      
      await setDoc(inventoryRef, {
        storeId: selectedStore,
        productId: currentProduct.id,
        quantity: currentQuantity,
        updatedAt: new Date()
      }, { merge: true });
      
      // Update local state
      const updatedInventory = new Map(inventory);
      
      if (!updatedInventory.has(selectedStore)) {
        updatedInventory.set(selectedStore, new Map<string, number>());
      }
      
      updatedInventory.get(selectedStore)?.set(currentProduct.id, currentQuantity);
      setInventory(updatedInventory);
      
      toast.success('Stock mis à jour avec succès');
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openUpdateDialog = (product: Product) => {
    setCurrentProduct(product);
    const qty = getProductQuantity(product.id, selectedStore);
    setCurrentQuantity(qty);
    setIsUpdateDialogOpen(true);
  };
  
  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive" className="w-24 justify-center">Épuisé</Badge>;
    } else if (quantity < 5) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 w-24 justify-center">Bas</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800 w-24 justify-center">Disponible</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestion des stocks</h1>
            <p className="text-gray-500">Gérer le stock des produits dans les boutiques</p>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              Sélectionner une boutique
            </CardTitle>
            <CardDescription>
              Choisissez la boutique pour voir et gérer son stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map(store => (
                <Button
                  key={store.id}
                  variant={selectedStore === store.id ? "default" : "outline"}
                  className="justify-start h-auto py-3"
                  onClick={() => setSelectedStore(store.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{store.name}</span>
                    <span className="text-xs text-gray-500">{store.address}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Inventaire des produits
            </CardTitle>
            <CardDescription>
              {selectedStore ? `Stock de la boutique : ${stores.find(s => s.id === selectedStore)?.name}` : 'Aucune boutique sélectionnée'}
            </CardDescription>
            
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher un produit..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : !selectedStore ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-500">Veuillez sélectionner une boutique pour voir son inventaire</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun produit trouvé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix de base</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => {
                    const quantity = getProductQuantity(product.id, selectedStore);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate">{product.description}</div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">{product.basePrice.toFixed(2)} €</TableCell>
                        <TableCell className="text-center">{quantity}</TableCell>
                        <TableCell className="text-center">
                          {getStockStatusBadge(quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openUpdateDialog(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Update Stock Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le stock</DialogTitle>
            <DialogDescription>
              Mettre à jour la quantité de {currentProduct?.name} dans le stock
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Produit</p>
              <p className="font-medium">{currentProduct?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Boutique</p>
              <p className="font-medium">
                {stores.find(s => s.id === selectedStore)?.name}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentQuantity(Math.max(0, currentQuantity - 1))}
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-center"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentQuantity(currentQuantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStock} disabled={isSubmitting}>
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;
