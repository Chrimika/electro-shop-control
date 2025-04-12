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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  AlertCircle,
  Filter,
} from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { db, collection, getDocs, query, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from '@/lib/firebase';
import { Product } from '@/types';
import { toast } from 'sonner';

interface ExtendedProduct extends Product {
  stockInfo?: {
    total: number;
    stores: Array<{
      storeId: string;
      storeName: string;
      quantity: number;
    }>;
  };
}

const ProductsPage = () => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ExtendedProduct | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    purchasePrice: 0,
    sellingPrice: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  useEffect(() => {
    let filtered = [...products];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.supplier.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter]);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      const productsArray = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        category: doc.data().category || '',
        description: doc.data().description || '',
        supplier: doc.data().supplier || '',
        purchasePrice: doc.data().purchasePrice || 0,
        sellingPrice: doc.data().sellingPrice || 0,
        imageUrl: doc.data().imageUrl || undefined,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as ExtendedProduct));
      
      const inventorySnapshot = await getDocs(collection(db, 'storeInventory'));
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      
      const storesMap = new Map();
      storesSnapshot.docs.forEach(doc => {
        storesMap.set(doc.id, doc.data().name);
      });
      
      const productInventory = new Map();
      
      inventorySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const productId = data.productId;
        const storeId = data.storeId;
        const quantity = data.quantity || 0;
        const storeName = storesMap.get(storeId) || storeId;
        
        if (!productInventory.has(productId)) {
          productInventory.set(productId, {
            total: 0,
            stores: []
          });
        }
        
        const product = productInventory.get(productId);
        product.total += quantity;
        product.stores.push({
          storeId,
          storeName,
          quantity
        });
      });
      
      productsArray.forEach(product => {
        if (productInventory.has(product.id)) {
          product.stockInfo = productInventory.get(product.id);
        }
      });
      
      const uniqueCategories = Array.from(
        new Set(productsArray.map(product => product.category))
      ).filter(Boolean);
      
      setCategories(uniqueCategories);
      setProducts(productsArray);
      setFilteredProducts(productsArray);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddProduct = async () => {
    try {
      setIsSubmitting(true);
      
      if (!formData.name || !formData.category || formData.purchasePrice < 0 || formData.sellingPrice <= 0) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }
      
      const productData = {
        ...formData,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'products'), productData);
      
      toast.success('Produit ajouté avec succès');
      resetForm();
      setIsAddDialogOpen(false);
      fetchProducts();
      
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateProduct = async () => {
    if (!currentProduct) return;
    
    try {
      setIsSubmitting(true);
      
      if (!formData.name || !formData.category || formData.purchasePrice < 0 || formData.sellingPrice <= 0) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }
      
      await updateDoc(doc(db, 'products', currentProduct.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Produit mis à jour avec succès');
      resetForm();
      setIsEditDialogOpen(false);
      fetchProducts();
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la mise à jour du produit');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteProduct = async () => {
    if (!currentProduct) return;
    
    try {
      setIsSubmitting(true);
      
      if (currentProduct.stockInfo && currentProduct.stockInfo.total > 0) {
        toast.error('Impossible de supprimer un produit en stock. Videz l\'inventaire d\'abord.');
        setIsSubmitting(false);
        setIsDeleteDialogOpen(false);
        return;
      }
      
      await deleteDoc(doc(db, 'products', currentProduct.id));
      
      toast.success('Produit supprimé avec succès');
      setIsDeleteDialogOpen(false);
      fetchProducts();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (product: ExtendedProduct) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      supplier: product.supplier,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (product: ExtendedProduct) => {
    setCurrentProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      supplier: '',
      purchasePrice: 0,
      sellingPrice: 0,
    });
    setCurrentProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestion des produits</h1>
            <p className="text-gray-500">Ajoutez, modifiez ou supprimez des produits</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="h-4 w-4 mr-2" /> Nouveau produit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouveau produit
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nom du produit"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie*</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category, index) => (
                          <SelectItem key={index} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="">Autre (nouvelle)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {formData.category === '' && (
                      <Input
                        placeholder="Nouvelle catégorie"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                      />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price-purchase">Prix d'achat (FCFA)*</Label>
                  <Input
                    id="price-purchase"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                    className="pr-12"
                  />
                  <span className="text-xs text-gray-500">Visible uniquement par le propriétaire</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price-selling">Prix de vente (FCFA)*</Label>
                  <Input
                    id="price-selling"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})}
                    className="pr-12"
                  />
                  <span className="text-xs text-gray-500">Visible par tous</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Nom du fournisseur"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description du produit"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}>
                  Annuler
                </Button>
                <Button onClick={handleAddProduct} disabled={isSubmitting}>
                  {isSubmitting ? 'En cours...' : 'Ajouter le produit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Liste des produits
            </CardTitle>
            <CardDescription>
              {filteredProducts.length} produit(s) au total
            </CardDescription>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher un produit..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="truncate">Catégorie</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category, index) => (
                    <SelectItem key={index} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">Aucun produit trouvé</p>
                <p className="text-gray-500 mb-6">
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par ajouter votre premier produit'}
                </p>
                
                {(searchQuery || categoryFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Stock total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.supplier || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {product.sellingPrice.toFixed(0)} FCFA
                          <div className="text-xs text-gray-500">
                            Achat: {product.purchasePrice.toFixed(0)} FCFA
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.stockInfo ? (
                            <span className={
                              product.stockInfo.total <= 0 
                                ? 'text-red-500' 
                                : product.stockInfo.total < 5 
                                  ? 'text-yellow-500' 
                                  : 'text-green-500'
                            }>
                              {product.stockInfo.total}
                            </span>
                          ) : (
                            '0'
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                <Edit className="h-4 w-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openDeleteDialog(product)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {!loading && filteredProducts.length > 0 && (
            <CardFooter className="border-t py-4 flex justify-between">
              <div className="text-sm text-gray-500">
                Affichage de {filteredProducts.length} produit(s) sur {products.length} au total
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>
              Modifiez les informations du produit
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du produit*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie*</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="">Autre (nouvelle)</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.category === '' && (
                  <Input
                    placeholder="Nouvelle catégorie"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-price-purchase">Prix d'achat (FCFA)*</Label>
              <Input
                id="edit-price-purchase"
                type="number"
                min="0"
                step="1"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                className="pr-12"
              />
              <span className="text-xs text-gray-500">Visible uniquement par le propriétaire</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-price-selling">Prix de vente (FCFA)*</Label>
              <Input
                id="edit-price-selling"
                type="number"
                min="0"
                step="1"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})}
                className="pr-12"
              />
              <span className="text-xs text-gray-500">Visible par tous</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Fournisseur</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsEditDialogOpen(false);
            }}>
              Annuler
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isSubmitting}>
              {isSubmitting ? 'En cours...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {currentProduct && currentProduct.stockInfo && currentProduct.stockInfo.total > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-700">
                    Ce produit est actuellement en stock ({currentProduct.stockInfo.total} unités).
                    Videz l'inventaire avant de supprimer le produit.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="py-4">
            <p><strong>Nom:</strong> {currentProduct?.name}</p>
            <p><strong>Catégorie:</strong> {currentProduct?.category}</p>
            <p><strong>Prix:</strong> {currentProduct?.sellingPrice.toFixed(0)} FCFA</p>
            <div className="text-xs text-gray-500">
              Achat: {currentProduct?.purchasePrice.toFixed(0)} FCFA
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsDeleteDialogOpen(false);
            }}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct} 
              disabled={isSubmitting || (currentProduct?.stockInfo && currentProduct.stockInfo.total > 0)}
            >
              {isSubmitting ? 'En cours...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
