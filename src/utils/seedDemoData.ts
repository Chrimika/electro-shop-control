
import { 
  db, 
  addDoc, 
  collection, 
  serverTimestamp, 
  getDocs, 
  query, 
  where 
} from '@/lib/firebase';
import { 
  User, 
  Store, 
  Product, 
  Customer, 
  Sale, 
  SaleItem, 
  StoreInventory,
  SaleType 
} from '@/types';

// Fonction pour vérifier si des données existent déjà pour un propriétaire spécifique
const hasExistingData = async (ownerId: string): Promise<boolean> => {
  // Vérifier s'il y a déjà des magasins pour cet owner
  const storesQuery = query(collection(db, 'stores'), where('ownerId', '==', ownerId));
  const storesSnap = await getDocs(storesQuery);
  return !storesSnap.empty;
};

// Fonction principale pour générer les données de démonstration
export const seedDemoData = async (currentUser: User): Promise<void> => {
  if (!currentUser || !currentUser.id) {
    throw new Error('Utilisateur non connecté');
  }

  // Vérifier si l'utilisateur a déjà des données
  const hasData = await hasExistingData(currentUser.id);
  if (hasData) {
    return; // Ne pas générer de données si l'utilisateur en a déjà
  }

  // 1. Créer un magasin pour l'utilisateur
  const storeRef = await addDoc(collection(db, 'stores'), {
    name: 'Magasin Principal',
    address: '123 Avenue Centrale, Dakar',
    phone: '+221 77 123 4567',
    email: 'contact@magasin.sn',
    createdAt: serverTimestamp(),
    ownerId: currentUser.id
  });
  const storeId = storeRef.id;

  // 2. Créer des catégories de produits
  const categories = [
    'Smartphones', 
    'Ordinateurs', 
    'Accessoires', 
    'Tablettes', 
    'Écouteurs'
  ];

  // 3. Créer des fournisseurs
  const suppliers = [
    'Tech Import SARL', 
    'Global Electronics', 
    'Digital World', 
    'IT Solutions', 
    'Smart Gadgets'
  ];

  // 4. Créer des produits
  const products = [];
  const productData = [
    { 
      name: 'iPhone 13', 
      category: 'Smartphones', 
      description: 'Smartphone haut de gamme avec excellent appareil photo', 
      supplier: 'Tech Import SARL', 
      purchasePrice: 350000, 
      sellingPrice: 450000 
    },
    { 
      name: 'Samsung Galaxy S22', 
      category: 'Smartphones', 
      description: 'Smartphone Android avec écran AMOLED', 
      supplier: 'Global Electronics', 
      purchasePrice: 320000, 
      sellingPrice: 400000 
    },
    { 
      name: 'MacBook Air M1', 
      category: 'Ordinateurs', 
      description: 'Ordinateur portable léger et puissant', 
      supplier: 'Tech Import SARL', 
      purchasePrice: 550000, 
      sellingPrice: 700000 
    },
    { 
      name: 'Lenovo ThinkPad', 
      category: 'Ordinateurs', 
      description: 'Ordinateur portable professionnel', 
      supplier: 'IT Solutions', 
      purchasePrice: 400000, 
      sellingPrice: 525000 
    },
    { 
      name: 'AirPods Pro', 
      category: 'Écouteurs', 
      description: 'Écouteurs sans fil avec réduction de bruit', 
      supplier: 'Tech Import SARL', 
      purchasePrice: 75000, 
      sellingPrice: 120000 
    },
    { 
      name: 'Chargeur USB-C', 
      category: 'Accessoires', 
      description: 'Chargeur rapide 20W', 
      supplier: 'Smart Gadgets', 
      purchasePrice: 5000, 
      sellingPrice: 12000 
    },
    { 
      name: 'iPad Air', 
      category: 'Tablettes', 
      description: 'Tablette polyvalente avec puce M1', 
      supplier: 'Tech Import SARL', 
      purchasePrice: 300000, 
      sellingPrice: 420000 
    },
    { 
      name: 'Adaptateur HDMI', 
      category: 'Accessoires', 
      description: 'Adaptateur pour connecter aux écrans externes', 
      supplier: 'Digital World', 
      purchasePrice: 8000, 
      sellingPrice: 15000 
    }
  ];

  for (const product of productData) {
    const productRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
      ownerId: currentUser.id,
      storeId: storeId
    });
    products.push({ id: productRef.id, ...product });
    
    // Ajouter l'inventaire pour ce produit
    await addDoc(collection(db, 'storeInventory'), {
      storeId: storeId,
      productId: productRef.id,
      quantity: Math.floor(Math.random() * 20) + 5, // Entre 5 et 25 unités en stock
      updatedAt: serverTimestamp()
    });
  }

  // 5. Créer des clients
  const customerData = [
    { name: 'Amadou Diop', phone: '+221 77 234 5678', email: 'amadou@example.com', isBadged: true },
    { name: 'Fatou Sow', phone: '+221 78 345 6789', email: 'fatou@example.com', isBadged: false },
    { name: 'Moussa Ndiaye', phone: '+221 76 456 7890', email: '', isBadged: false },
    { name: 'Aïssatou Fall', phone: '+221 77 567 8901', email: 'aissatou@example.com', isBadged: true },
    { name: 'Ibrahim Gueye', phone: '+221 70 678 9012', email: '', isBadged: false }
  ];

  const customers = [];
  for (const customer of customerData) {
    const customerRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      storeId: storeId,
      createdAt: serverTimestamp()
    });
    customers.push({ id: customerRef.id, ...customer });
  }

  // 6. Créer des vendeurs (vendors)
  const vendorData = [
    { email: 'vendeur1@magasin.sn', displayName: 'Omar Seck', password: 'vendor123' },
    { email: 'vendeur2@magasin.sn', displayName: 'Adama Diallo', password: 'vendor123' }
  ];

  // 7. Créer quelques ventes
  const createRandomSale = async () => {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const numProducts = Math.floor(Math.random() * 3) + 1; // 1 à 3 produits par vente
    const saleItems: SaleItem[] = [];
    let totalAmount = 0;

    // Ajouter des produits aléatoires à la vente
    for (let i = 0; i < numProducts; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1 à 3 unités
      const totalPrice = product.sellingPrice * quantity;
      
      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.sellingPrice,
        totalPrice: totalPrice
      });
      
      totalAmount += totalPrice;
    }

    // Définir le type de vente
    const saleTypeOptions: SaleType[] = ['direct', 'installment', 'partialPaid', 'deliveredNotPaid'];
    // Créer une distribution avec plus de ventes directes
    const randomIndex = Math.floor(Math.random() * 10);
    const saleType: SaleType = randomIndex < 6 
      ? 'direct'                                    // 60% chance de vente directe
      : saleTypeOptions[Math.floor(Math.random() * saleTypeOptions.length)]; // 40% chance pour les autres types

    // Déterminer le montant payé en fonction du type de vente
    let paidAmount = 0;
    if (saleType === 'direct') {
      paidAmount = totalAmount;
    } else if (saleType === 'partialPaid') {
      paidAmount = totalAmount * 0.8;
    } else if (saleType === 'installment') {
      paidAmount = totalAmount * 0.5;
    }

    // Définir le statut de la vente
    const status = saleType === 'direct' ? 'completed' : 'pending';

    // Créer une date aléatoire dans les 30 derniers jours
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

    // Créer la vente
    await addDoc(collection(db, 'sales'), {
      storeId: storeId,
      vendorId: currentUser.id, // Utiliser l'ID du propriétaire comme vendeur pour les données de test
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isBadged: customer.isBadged
      },
      items: saleItems,
      saleType: saleType,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      createdAt: randomDate,
      status: status,
      deadline: saleType !== 'direct' ? new Date(randomDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null // +30 jours
    });
  };

  // Créer 10 ventes aléatoires
  for (let i = 0; i < 10; i++) {
    await createRandomSale();
  }

  return;
};
