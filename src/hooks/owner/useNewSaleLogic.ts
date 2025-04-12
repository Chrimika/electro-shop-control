
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Timestamp 
} from '../../lib/firebase';
import { Product, Customer, SaleItem, SaleType } from '../../types';
import { toast } from 'sonner';

export const useNewSaleLogic = () => {
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
};
