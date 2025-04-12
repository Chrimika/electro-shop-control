
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  Package,
  User,
  Phone,
  Mail,
  ShoppingCart,
  Store as StoreIcon,
  AlertCircle,
  Receipt,
  CreditCard,
} from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { useAuth } from '../../contexts/AuthContext';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from '../../lib/firebase';
import { Product, Customer, SaleItem, SaleType } from '../../types';
import { toast } from 'sonner';

const OwnerNewSale = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);
  const [storeInventory, setStoreInventory] = useState<{[productId: string]: number}>({});
  
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [saleType, setSaleType] = useState<SaleType>('direct');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // Form for new customer
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    isBadged: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerWarning, setShowCustomerWarning] = useState(false);
  
  useEffect(() => {
    // Fetch stores
    const fetchStores = async () => {
      try {
        const storesQuery = query(collection(db, 'stores'));
        const storesSnapshot = await getDocs(storesQuery);
        const storesData = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setStores(storesData);
      } catch (err) {
        console.error('Erreur lors du chargement des boutiques:', err);
        toast.error('Erreur lors du chargement des boutiques');
      }
    };
    
    fetchStores();
    
    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const customersQuery = query(collection(db, 'customers'));
        const customersSnapshot = await getDocs(customersQuery);
        const customersData = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Customer));
        
        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } catch (err) {
        console.error('Erreur lors du chargement des clients:', err);
        toast.error('Erreur lors du chargement des clients');
      }
    };
    
    fetchCustomers();
  }, []);
  
  useEffect(() => {
    // Filter customers based on search query
    if (!customerSearchQuery.trim()) {
      setFilteredCustomers(customers);
    } else {
      const query = customerSearchQuery.toLowerCase();
      const filtered = customers.filter(
        customer =>
          customer.name.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query) ||
          (customer.email && customer.email.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchQuery, customers]);
  
  useEffect(() => {
    // Update total whenever cart changes
    const newTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotal(newTotal);
    // If direct sale, set paid amount to total automatically
    if (saleType === 'direct') {
      setPaidAmount(newTotal);
    }
  }, [cart, saleType]);
  
  useEffect(() => {
    // Fetch products and inventory when store is selected
    const fetchProductsAndInventory = async () => {
      if (!selectedStore) return;
      
      try {
        // Fetch all products
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Product));
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Fetch inventory for the selected store
        const inventoryQuery = query(
          collection(db, 'storeInventory'),
          where('storeId', '==', selectedStore)
        );
        const inventorySnapshot = await getDocs(inventoryQuery);
        
        const inventoryMap: {[productId: string]: number} = {};
        inventorySnapshot.forEach(doc => {
          inventoryMap[doc.data().productId] = doc.data().quantity;
        });
        
        setStoreInventory(inventoryMap);
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err);
        toast.error('Erreur lors du chargement des produits');
      }
    };
    
    fetchProductsAndInventory();
  }, [selectedStore]);
  
  useEffect(() => {
    // Filter products based on search query
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);
  
  const handleAddToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      const updatedCart = cart.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * item.unitPrice
            }
          : item
      );
      setCart(updatedCart);
    } else {
      // Add new item to cart
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        totalPrice: product.basePrice
      };
      setCart([...cart, newItem]);
    }
  };
  
  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
  };
  
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const updatedCart = cart.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            totalPrice: quantity * item.unitPrice
          }
        : item
    );
    
    setCart(updatedCart);
  };
  
  const handleAddCustomer = async () => {
    // Form validation
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Le nom et le téléphone du client sont obligatoires');
      return;
    }
    
    try {
      const customerData = {
        ...newCustomer,
        createdAt: serverTimestamp()
      };
      
      const customerRef = await addDoc(collection(db, 'customers'), customerData);
      const newCustomerWithId: Customer = {
        id: customerRef.id,
        ...newCustomer
      };
      
      setCustomers([...customers, newCustomerWithId]);
      setSelectedCustomer(newCustomerWithId);
      
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        isBadged: false
      });
      
      toast.success('Client ajouté avec succès');
      
      // Close the dialog (using a ref or by controlling the state)
      return newCustomerWithId;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du client:', err);
      toast.error('Erreur lors de l\'ajout du client');
      return null;
    }
  };
  
  const handleSubmitSale = async () => {
    // Validation
    if (!selectedStore) {
      toast.error('Veuillez sélectionner une boutique');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Veuillez ajouter des produits à la vente');
      return;
    }
    
    if (saleType !== 'direct' && !selectedCustomer) {
      setShowCustomerWarning(true);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the sale object with the proper type that includes the deadline property
      const saleData: {
        storeId: string;
        vendorId: string | undefined;
        customer: {
          id: string;
          name: string;
          phone: string;
          email?: string;
          isBadged: boolean;
        } | null;
        items: SaleItem[];
        saleType: SaleType;
        totalAmount: number;
        paidAmount: number;
        createdAt: any;
        status: string;
        deadline?: Date;
      } = {
        storeId: selectedStore,
        vendorId: currentUser?.id,
        customer: selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email,
          isBadged: selectedCustomer.isBadged
        } : null,
        items: cart,
        saleType,
        totalAmount: total,
        paidAmount: Math.min(paidAmount, total), // Cannot pay more than total
        createdAt: Timestamp.now(),
        status: paidAmount >= total ? 'completed' : 'pending'
      };
      
      // Add deadline if payment is not complete
      if (paidAmount < total) {
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 1); // Default: 1 month
        saleData.deadline = deadline;
      }
      
      // Save to database
      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      
      // Update inventory
      cart.forEach(async (item) => {
        // Get current inventory
        const inventoryQuery = query(
          collection(db, 'storeInventory'),
          where('storeId', '==', selectedStore),
          where('productId', '==', item.productId)
        );
        
        const inventorySnapshot = await getDocs(inventoryQuery);
        
        if (!inventorySnapshot.empty) {
          const inventoryDoc = inventorySnapshot.docs[0];
          const currentQuantity = inventoryDoc.data().quantity || 0;
          
          // Update inventory
          await updateDoc(doc(db, 'storeInventory', inventoryDoc.id), {
            quantity: Math.max(0, currentQuantity - item.quantity), // Prevent negative inventory
            updatedAt: serverTimestamp()
          });
        }
      });
      
      toast.success('Vente enregistrée avec succès');
      navigate('/owner/sales');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la vente:', err);
      toast.error('Erreur lors de l\'enregistrement de la vente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={() => navigate('/owner/sales')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Nouvelle vente</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product selection and cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <StoreIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Sélection de la boutique
                </CardTitle>
                <CardDescription>
                  Sélectionnez la boutique pour cette vente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une boutique" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Produits
                </CardTitle>
                <CardDescription>
                  Recherchez et ajoutez des produits à la vente
                </CardDescription>
                
                <div className="mt-2 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="pl-8" 
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {!selectedStore ? (
                  <div className="text-center py-6">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Veuillez d'abord sélectionner une boutique</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-6">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Aucun produit trouvé</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProducts.map(product => {
                      const inStock = storeInventory[product.id] || 0;
                      return (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{product.name}</h3>
                                <Badge variant="outline">{product.category}</Badge>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{product.basePrice} €</div>
                                <div className="text-xs">
                                  {inStock > 0 ? (
                                    <span className="text-green-600">En stock: {inStock}</span>
                                  ) : (
                                    <span className="text-red-600">Rupture de stock</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button 
                                size="sm" 
                                onClick={() => handleAddToCart(product)}
                                disabled={inStock <= 0}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Ajouter
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Shopping cart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                  Panier
                </CardTitle>
                <CardDescription>
                  {cart.length === 0 ? 'Le panier est vide' : `${cart.length} produit(s) dans le panier`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Ajoutez des produits au panier</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.unitPrice} €</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.totalPrice} €</TableCell>
                          <TableCell>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-red-500"
                              onClick={() => handleRemoveFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sale summary and customer */}
          <div className="space-y-6">
            {/* Customer selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Client
                </CardTitle>
                <CardDescription>
                  {selectedCustomer ? 'Client sélectionné' : 'Sélectionner ou ajouter un client'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCustomer ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{selectedCustomer.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          {selectedCustomer.phone}
                        </div>
                        {selectedCustomer.email && (
                          <div className="flex items-center text-sm text-gray-500 mt-0.5">
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            {selectedCustomer.email}
                          </div>
                        )}
                      </div>
                      {selectedCustomer.isBadged && (
                        <Badge>Client privilégié</Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Changer de client
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">
                          <User className="h-4 w-4 mr-2" />
                          Sélectionner un client
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-full sm:max-w-xl">
                        <SheetHeader>
                          <SheetTitle>Sélectionner un client</SheetTitle>
                          <SheetDescription>
                            Recherchez un client existant ou créez-en un nouveau
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="mt-4 relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input 
                            className="pl-8" 
                            placeholder="Rechercher par nom, téléphone ou email..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          />
                        </div>
                        
                        <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                          {filteredCustomers.length === 0 ? (
                            <div className="text-center py-6">
                              <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Aucun client trouvé</p>
                            </div>
                          ) : (
                            filteredCustomers.map(customer => (
                              <div
                                key={customer.id}
                                className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  document.querySelector<HTMLButtonElement>('.sheet-close')?.click();
                                }}
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-medium">{customer.name}</h3>
                                    <div className="text-sm text-gray-500">{customer.phone}</div>
                                    {customer.email && (
                                      <div className="text-sm text-gray-500">{customer.email}</div>
                                    )}
                                  </div>
                                  {customer.isBadged && (
                                    <Badge>Client privilégié</Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <SheetFooter className="mt-6">
                          <SheetClose asChild>
                            <Button variant="outline" className="w-full">Annuler</Button>
                          </SheetClose>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nouveau client
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un nouveau client</DialogTitle>
                          <DialogDescription>
                            Remplissez les informations pour créer un nouveau client
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nom du client*</Label>
                            <Input
                              id="name"
                              placeholder="Nom du client"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone*</Label>
                            <Input
                              id="phone"
                              placeholder="Numéro de téléphone"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Email (optionnel)"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 pt-2">
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
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              document.querySelector<HTMLButtonElement>('.dialog-close')?.click();
                            }}
                          >
                            Annuler
                          </Button>
                          <Button 
                            onClick={async () => {
                              const customer = await handleAddCustomer();
                              if (customer) {
                                document.querySelector<HTMLButtonElement>('.dialog-close')?.click();
                              }
                            }}
                          >
                            Ajouter le client
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Sale summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                  Détails de la vente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="saleType">Type de vente</Label>
                  <Select value={saleType} onValueChange={(value: SaleType) => setSaleType(value)}>
                    <SelectTrigger id="saleType">
                      <SelectValue placeholder="Sélectionner le type de vente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Vente directe (paiement complet)</SelectItem>
                      <SelectItem value="installment">Vente en tranches</SelectItem>
                      <SelectItem value="partialPaid">80% payé</SelectItem>
                      <SelectItem value="deliveredNotPaid">Livré non payé</SelectItem>
                      <SelectItem value="trade">Troc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="paidAmount">Montant payé</Label>
                  <div className="relative">
                    <Input
                      id="paidAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      max={total}
                      value={saleType === 'direct' ? total : paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      disabled={saleType === 'direct'}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between py-1">
                  <span className="font-medium">Total des articles</span>
                  <span className="font-bold">{total.toFixed(2)} €</span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="font-medium text-green-600">Montant payé</span>
                  <span className="font-medium text-green-600">
                    {(saleType === 'direct' ? total : paidAmount).toFixed(2)} €
                  </span>
                </div>
                
                {saleType !== 'direct' && (
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-red-600">Reste à payer</span>
                    <span className="font-medium text-red-600">
                      {Math.max(0, total - paidAmount).toFixed(2)} €
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  className="w-full"
                  disabled={cart.length === 0 || !selectedStore || isSubmitting}
                  onClick={handleSubmitSale}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      En cours...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Finaliser la vente
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Warning dialog for customer requirement */}
      <Dialog open={showCustomerWarning} onOpenChange={setShowCustomerWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client requis</DialogTitle>
            <DialogDescription>
              Ce type de vente nécessite un client associé pour le suivi des paiements.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Veuillez sélectionner un client existant ou créer un nouveau client avant de continuer.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCustomerWarning(false)}>Compris</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerNewSale;
