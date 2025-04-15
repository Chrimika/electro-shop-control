import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Timestamp 
} from '@/lib/firebase';
import { Product, Customer, SaleItem, SaleType } from '@/types';
import { toast } from 'sonner';

export function useNewSaleLogic() {
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerWarning, setShowCustomerWarning] = useState(false);

  const calculateTotal = (items: SaleItem[]) => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };
  
  useEffect(() => {
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
    const newTotal = calculateTotal(cart);
    setTotal(newTotal);
    if (saleType === 'direct') {
      setPaidAmount(newTotal);
    }
  }, [cart, saleType]);
  
  useEffect(() => {
    const fetchProductsAndInventory = async () => {
      if (!selectedStore) return;
      
      try {
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Product));
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        
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
  
  const handleAddToCart = (product: Product, quantity: number = 1, customPrice?: number) => {
    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    const unitPrice = customPrice !== undefined ? customPrice : product.sellingPrice;
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      const item = updatedCart[existingItemIndex];
      
      const availableStock = storeInventory[product.id] || 0;
      if (item.quantity + quantity > availableStock) {
        toast.error(`Stock insuffisant. Maximum disponible: ${availableStock}`);
        return;
      }
      
      item.quantity += quantity;
      if (customPrice !== undefined) {
        item.unitPrice = unitPrice;
      }
      item.totalPrice = item.quantity * item.unitPrice;
      updatedCart[existingItemIndex] = item;
      setCart(updatedCart);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * quantity
      };
      setCart([...cart, newItem]);
    }
    
    toast.success(`${quantity} ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier`);
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
  
  const handleSubmitSale = async () => {
    if (!selectedStore) {
      toast.error('Veuillez sélectionner une boutique');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Veuillez ajouter des produits à la vente');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
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
        paidAmount: Math.min(paidAmount, total),
        createdAt: Timestamp.now(),
        status: paidAmount >= total ? 'completed' : 'pending'
      };
      
      if (paidAmount < total) {
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 1);
        saleData.deadline = deadline;
      }
      
      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      
      cart.forEach(async (item) => {
        const inventoryQuery = query(
          collection(db, 'storeInventory'),
          where('storeId', '==', selectedStore),
          where('productId', '==', item.productId)
        );
        
        const inventorySnapshot = await getDocs(inventoryQuery);
        
        if (!inventorySnapshot.empty) {
          const inventoryDoc = inventorySnapshot.docs[0];
          const currentQuantity = inventoryDoc.data().quantity || 0;
          
          await updateDoc(doc(db, 'storeInventory', inventoryDoc.id), {
            quantity: Math.max(0, currentQuantity - item.quantity),
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
  
  return {
    products,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedStore,
    setSelectedStore,
    stores,
    storeInventory,
    cart,
    saleType,
    setSaleType,
    paidAmount,
    setPaidAmount,
    total,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    filteredCustomers,
    customerSearchQuery,
    setCustomerSearchQuery,
    isSubmitting,
    showCustomerWarning,
    setShowCustomerWarning,
    handleAddToCart,
    handleRemoveFromCart,
    updateItemQuantity,
    handleSubmitSale
  };
}
