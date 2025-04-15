import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ChevronLeft, CircleDollarSign, Plus, Search, ShoppingBag, Trash2, User, Eye } from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from '@/lib/firebase';
import { Product, Customer, SaleItem, SaleType, Sale } from '@/types';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import SaleReceipt from '@/components/vendor/SaleReceipt';

const NewSale = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleType, setSaleType] = useState<SaleType>('direct');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [deadline, setDeadline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [storeName, setStoreName] = useState('');
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    isBadged: false
  });
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.storeId) return;
      
      try {
        setLoading(true);
        
        const storeDoc = await getDoc(doc(db, 'stores', currentUser.storeId));
        if (storeDoc.exists()) {
          setStoreName(storeDoc.data().name || 'Boutique');
        }
        
        if (currentUser.id) {
          const vendorDoc = await getDoc(doc(db, 'users', currentUser.id));
          if (vendorDoc.exists()) {
            setVendorName(vendorDoc.data().displayName || 'Vendeur');
          }
        }
        
        const productsQuery = query(
          collection(db, 'products'),
          where('storeId', '==', currentUser.storeId)
        );
        
        const productDocs = await getDocs(productsQuery);
        const productsData = productDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        
        setProducts(productsData);
        
        const customersQuery = query(
          collection(db, 'customers'),
          where('storeId', '==', currentUser.storeId)
        );
        
        const customerDocs = await getDocs(customersQuery);
        const customersData = customerDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Customer));
        
        setCustomers(customersData);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        toast.error('Erreur lors du chargement des données');
        setLoading(false);
      }
    };
    
    fetchData();
    
    const handleShowPreview = () => setShowPreview(true);
    window.addEventListener('showReceiptPreview', handleShowPreview);
    
    return () => {
      window.removeEventListener('showReceiptPreview', handleShowPreview);
    };
  }, [currentUser]);
  
  const filteredProducts = productSearch
    ? products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.category.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;
    
  const filteredCustomers = customerSearch
    ? customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch)
      )
    : customers;
  
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const unitPrice = customPrice !== undefined ? customPrice : selectedProduct.sellingPrice;
    
    const existingItemIndex = cartItems.findIndex(item => item.productId === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      if (customPrice !== undefined) {
        updatedItems[existingItemIndex].unitPrice = unitPrice;
      }
      updatedItems[existingItemIndex].totalPrice = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setCartItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * quantity
      };
      
      setCartItems([...cartItems, newItem]);
    }
    
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice(undefined);
    toast.success('Produit ajouté au panier', {
      action: {
        label: 'Voir le reçu',
        onClick: () => setShowPreview(true)
      }
    });
  };
  
  const handleRemoveFromCart = (index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
  };
  
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Le nom et le téléphone sont obligatoires');
      return;
    }

    try {
      const customerData = {
        ...newCustomer,
        storeId: currentUser?.storeId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'customers'), customerData);
      const newCustomerWithId = {
        id: docRef.id,
        ...newCustomer
      };

      setCustomers([...customers, newCustomerWithId]);
      setSelectedCustomer(newCustomerWithId);
      
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        isBadged: false
      });
      
      toast.success('Client créé avec succès');
      setIsNewCustomerDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      toast.error('Erreur lors de la création du client');
    }
  };
  
  const handleCreateSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Veuillez ajouter au moins un produit au panier');
      return;
    }
    
    if (['installment', 'partialPaid', 'deliveredNotPaid'].includes(saleType) && !deadline) {
      toast.error('Veuillez spécifier une date limite de paiement');
      return;
    }
    
    try {
      if (!currentUser?.storeId) {
        toast.error('Erreur d\'identification du magasin');
        return;
      }
      
      const totalAmount = calculateTotal();
      let paidAmount = 0;
      
      if (saleType === 'direct') {
        paidAmount = totalAmount;
      } else if (saleType === 'partialPaid') {
        paidAmount = totalAmount * 0.8;
      }
      
      const saleData = {
        storeId: currentUser.storeId,
        vendorId: currentUser.id,
        customer: selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone
        } : null,
        items: cartItems,
        saleType: saleType,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        createdAt: serverTimestamp(),
        deadline: deadline ? new Date(deadline) : null,
        status: saleType === 'direct' ? 'completed' : 'pending'
      };
      
      const docRef = await addDoc(collection(db, 'sales'), saleData);
      toast.success('Vente enregistrée avec succès');
      navigate(`/vendor/sales/${docRef.id}`);
    } catch (err) {
      console.error('Erreur lors de la création de la vente:', err);
      toast.error('Erreur lors de la création de la vente');
    }
  };
  
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };
  
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };
  
  const previewSale: Sale = {
    id: 'preview',
    storeId: currentUser?.storeId || '',
    vendorId: currentUser?.id || '',
    customer: selectedCustomer ? {
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone
    } : null,
    items: cartItems,
    saleType: saleType,
    totalAmount: calculateTotal(),
    paidAmount: saleType === 'direct' ? calculateTotal() : 
              saleType === 'partialPaid' ? calculateTotal() * 0.8 : 0,
    createdAt: new Date(),
    deadline: deadline ? new Date(deadline) : undefined,
    status: saleType === 'direct' ? 'completed' : 'pending'
  };

  if (showPreview && cartItems.length > 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VendorHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(false)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Retour à la vente
            </Button>
            <h1 className="text-2xl font-bold">Aperçu du reçu</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <SaleReceipt sale={previewSale} vendorName={vendorName} storeName={storeName} />
          </div>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => setShowPreview(false)}
              className="mx-2"
            >
              Retour à la vente
            </Button>
            <Button 
              onClick={() => {
                window.print();
              }}
              variant="outline" 
              className="mx-2"
            >
              Imprimer l'aperçu
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2" 
              onClick={() => navigate('/vendor/dashboard')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <h1 className="text-3xl font-bold">Nouvelle vente</h1>
          </div>
          
          {cartItems.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Aperçu du reçu
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sélection des produits</CardTitle>
              <CardDescription>Recherchez et ajoutez des produits au panier</CardDescription>
              
              <div className="mt-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher un produit..."
                  className="pl-8"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectProduct(product)}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.category}</p>
                        </div>
                        <p className="font-bold">{product.sellingPrice} FCFA</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCustomer ? (
                  <div className="mb-4">
                    <p><span className="font-medium">Nom:</span> {selectedCustomer.name}</p>
                    <p><span className="font-medium">Téléphone:</span> {selectedCustomer.phone}</p>
                    {selectedCustomer.email && (
                      <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Changer de client
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <User className="h-4 w-4 mr-2" /> Sélectionner un client
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Sélectionner un client</DialogTitle>
                          <DialogDescription>
                            Recherchez et sélectionnez un client pour cette vente
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative mb-4">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Rechercher un client..."
                            className="pl-8"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <p className="text-center py-4">Aucun client trouvé</p>
                          ) : (
                            <div className="space-y-2">
                              {filteredCustomers.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                  onClick={() => {
                                    handleSelectCustomer(customer);
                                    document.querySelector('[data-state="open"]')?.setAttribute('data-state', 'closed');
                                  }}
                                >
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.phone}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Annuler</Button>
                          <DialogClose asChild>
                            <Button>Fermer</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Nouveau client
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Créer un nouveau client</DialogTitle>
                          <DialogDescription>
                            Ajoutez les informations du nouveau client
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <Label htmlFor="customerName">Nom*</Label>
                            <Input
                              id="customerName"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                              placeholder="Nom du client"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="customerPhone">Téléphone*</Label>
                            <Input
                              id="customerPhone"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                              placeholder="Numéro de téléphone"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="customerEmail">Email</Label>
                            <Input
                              id="customerEmail"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                              placeholder="Email (optionnel)"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isBadged"
                              checked={newCustomer.isBadged}
                              onChange={(e) => setNewCustomer({...newCustomer, isBadged: e.target.checked})}
                            />
                            <Label htmlFor="isBadged">Client privilégié</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsNewCustomerDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button onClick={handleCreateNewCustomer}>
                            Créer le client
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                
                <div className="mt-4">
                  <Label htmlFor="saleType" className="mb-2 block">Type de vente</Label>
                  <Select 
                    value={saleType} 
                    onValueChange={(value: SaleType) => setSaleType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type de vente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Vente directe (payée)</SelectItem>
                      <SelectItem value="installment">Vente en tranches</SelectItem>
                      <SelectItem value="partialPaid">80% payé</SelectItem>
                      <SelectItem value="deliveredNotPaid">Livré non payé</SelectItem>
                      <SelectItem value="trade">Troc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {['installment', 'partialPaid', 'deliveredNotPaid'].includes(saleType) && (
                  <div className="mt-4">
                    <Label htmlFor="deadline" className="mb-2 block">Date limite de paiement</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter au panier</DialogTitle>
                  <DialogDescription>
                    Spécifiez la quantité pour {selectedProduct?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label htmlFor="quantity" className="col-span-1">Quantité</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="col-span-3"
                    />
                  </div>
                  {selectedProduct && (
                    <div className="flex justify-between">
                      <span>Prix unitaire par défaut:</span>
                      <span>{selectedProduct.sellingPrice} FCFA</span>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label htmlFor="customPrice" className="col-span-1 flex items-center">
                      Prix <CircleDollarSign className="h-4 w-4 ml-1 text-gray-500" />
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="customPrice"
                        type="number"
                        placeholder="Prix personnalisé"
                        value={customPrice === undefined ? "" : customPrice}
                        min="0"
                        onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="col-span-3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Laissez vide pour utiliser le prix par défaut
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      {selectedProduct 
                        ? ((customPrice !== undefined ? customPrice : selectedProduct.sellingPrice) * quantity) 
                        : 0} FCFA
                    </span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddToCart}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter au panier
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Card>
              <CardHeader>
                <CardTitle>Panier</CardTitle>
                <CardDescription>Articles à vendre</CardDescription>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-4">
                    <ShoppingBag className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Le panier est vide</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <div className="text-sm text-gray-600">
                            {item.quantity} x {item.unitPrice} FCFA
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="font-bold mr-4">{item.totalPrice} FCFA</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveFromCart(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{calculateTotal()} FCFA</span>
                    </div>
                    
                    {saleType === 'partialPaid' && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Montant payé (80%):</span>
                          <span>{(calculateTotal() * 0.8).toFixed(2)} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Restant à payer:</span>
                          <span>{(calculateTotal() * 0.2).toFixed(2)} FCFA</span>
                        </div>
                      </div>
                    )}
                    
                    {saleType === 'installment' && (
                      <p className="text-sm text-gray-500">Le client paiera en plusieurs fois jusqu'à la date limite.</p>
                    )}
                    
                    {saleType === 'deliveredNotPaid' && (
                      <p className="text-sm text-gray-500">Le produit est livré mais pas encore payé.</p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={cartItems.length === 0}
                  onClick={handleCreateSale}
                >
                  Finaliser la vente
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewSale;
