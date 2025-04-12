
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  AlertCircle,
  UserCheck,
  ShoppingBag,
  Wrench
} from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { db, collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from '../../lib/firebase';
import { Customer, Sale, RepairRequest } from '../../types';
import { toast } from 'sonner';

interface CustomerWithStats extends Customer {
  salesCount?: number;
  repairsCount?: number;
  lastPurchase?: Date;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [badgedFilter, setBadgedFilter] = useState<boolean | null>(null);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewCustomerDialogOpen, setIsViewCustomerDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerWithStats | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    isBadged: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [customerRepairs, setCustomerRepairs] = useState<RepairRequest[]>([]);
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  useEffect(() => {
    // Apply filters
    let filtered = [...customers];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        customer =>
          customer.name.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query) ||
          (customer.email && customer.email.toLowerCase().includes(query))
      );
    }
    
    if (badgedFilter !== null) {
      filtered = filtered.filter(customer => customer.isBadged === badgedFilter);
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchQuery, badgedFilter]);
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersQuery = query(
        collection(db, 'customers'),
        orderBy('name')
      );
      const customersSnapshot = await getDocs(customersQuery);
      
      const customersArray: CustomerWithStats[] = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        phone: doc.data().phone || '',
        email: doc.data().email || '',
        isBadged: doc.data().isBadged || false
      }));
      
      // Fetch sales for stats
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      
      // Fetch repairs for stats
      const repairsSnapshot = await getDocs(collection(db, 'repairs'));
      
      // Map of customer ID to stats
      const statsMap = new Map();
      
      // Process sales
      salesSnapshot.docs.forEach(doc => {
        const sale = doc.data();
        if (sale.customer && sale.customer.id) {
          const customerId = sale.customer.id;
          if (!statsMap.has(customerId)) {
            statsMap.set(customerId, { 
              salesCount: 0, 
              repairsCount: 0, 
              lastPurchase: null 
            });
          }
          
          const stats = statsMap.get(customerId);
          stats.salesCount++;
          
          const saleDate = sale.createdAt?.toDate() || new Date();
          if (!stats.lastPurchase || saleDate > stats.lastPurchase) {
            stats.lastPurchase = saleDate;
          }
        }
      });
      
      // Process repairs
      repairsSnapshot.docs.forEach(doc => {
        const repair = doc.data();
        if (repair.customerId) {
          const customerId = repair.customerId;
          if (!statsMap.has(customerId)) {
            statsMap.set(customerId, { 
              salesCount: 0, 
              repairsCount: 0, 
              lastPurchase: null 
            });
          }
          
          const stats = statsMap.get(customerId);
          stats.repairsCount++;
        }
      });
      
      // Add stats to customers
      customersArray.forEach(customer => {
        if (statsMap.has(customer.id)) {
          const stats = statsMap.get(customer.id);
          customer.salesCount = stats.salesCount;
          customer.repairsCount = stats.repairsCount;
          customer.lastPurchase = stats.lastPurchase;
        } else {
          customer.salesCount = 0;
          customer.repairsCount = 0;
        }
      });
      
      setCustomers(customersArray);
      setFilteredCustomers(customersArray);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCustomerDetails = async (customerId: string) => {
    try {
      // Fetch customer's sales
      const salesQuery = query(collection(db, 'sales'));
      const salesSnapshot = await getDocs(salesQuery);
      
      const customerSalesData = salesSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as Sale;
        })
        .filter(sale => sale.customer?.id === customerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setCustomerSales(customerSalesData);
      
      // Fetch customer's repairs
      const repairsQuery = query(collection(db, 'repairs'));
      const repairsSnapshot = await getDocs(repairsQuery);
      
      const customerRepairsData = repairsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as RepairRequest;
        })
        .filter(repair => repair.customerId === customerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setCustomerRepairs(customerRepairsData);
      
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Erreur lors du chargement des détails du client');
    }
  };
  
  const handleAddCustomer = async () => {
    try {
      setIsSubmitting(true);
      
      // Validation
      if (!formData.name || !formData.phone) {
        toast.error('Le nom et le numéro de téléphone sont obligatoires');
        setIsSubmitting(false);
        return;
      }
      
      const customerData = {
        ...formData,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'customers'), customerData);
      
      toast.success('Client ajouté avec succès');
      resetForm();
      setIsAddDialogOpen(false);
      fetchCustomers();
      
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Erreur lors de l\'ajout du client');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateCustomer = async () => {
    if (!currentCustomer) return;
    
    try {
      setIsSubmitting(true);
      
      // Validation
      if (!formData.name || !formData.phone) {
        toast.error('Le nom et le numéro de téléphone sont obligatoires');
        setIsSubmitting(false);
        return;
      }
      
      await updateDoc(doc(db, 'customers', currentCustomer.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Client mis à jour avec succès');
      resetForm();
      setIsEditDialogOpen(false);
      fetchCustomers();
      
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Erreur lors de la mise à jour du client');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCustomer = async () => {
    if (!currentCustomer) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if customer has sales or repairs
      if ((currentCustomer.salesCount && currentCustomer.salesCount > 0) || 
          (currentCustomer.repairsCount && currentCustomer.repairsCount > 0)) {
        toast.error('Impossible de supprimer un client avec des ventes ou des réparations associées');
        setIsSubmitting(false);
        setIsDeleteDialogOpen(false);
        return;
      }
      
      await deleteDoc(doc(db, 'customers', currentCustomer.id));
      
      toast.success('Client supprimé avec succès');
      setIsDeleteDialogOpen(false);
      fetchCustomers();
      
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Erreur lors de la suppression du client');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (customer: CustomerWithStats) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      isBadged: customer.isBadged
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (customer: CustomerWithStats) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };
  
  const openViewCustomerDialog = async (customer: CustomerWithStats) => {
    setCurrentCustomer(customer);
    await fetchCustomerDetails(customer.id);
    setIsViewCustomerDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      isBadged: false
    });
    setCurrentCustomer(null);
  };

  const getSaleStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Complétée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getRepairStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'diagnosed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Diagnostiqué</Badge>;
      case 'repairing':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">En réparation</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Terminé</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestion des clients</h1>
            <p className="text-gray-500">Ajoutez, modifiez ou supprimez des clients</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="h-4 w-4 mr-2" /> Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau client</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouveau client
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du client*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nom complet du client"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone*</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Adresse email (optionnel)"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="isBadged" 
                    checked={formData.isBadged}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, isBadged: checked === true})
                    }
                  />
                  <Label htmlFor="isBadged">Client privilégié</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}>
                  Annuler
                </Button>
                <Button onClick={handleAddCustomer} disabled={isSubmitting}>
                  {isSubmitting ? 'En cours...' : 'Ajouter le client'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Liste des clients
            </CardTitle>
            <CardDescription>
              {filteredCustomers.length} client(s) au total
            </CardDescription>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant={badgedFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBadgedFilter(null)}
                >
                  Tous
                </Button>
                <Button 
                  variant={badgedFilter === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBadgedFilter(true)}
                >
                  Privilégiés
                </Button>
                <Button 
                  variant={badgedFilter === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBadgedFilter(false)}
                >
                  Standards
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">Aucun client trouvé</p>
                <p className="text-gray-500 mb-6">
                  {searchQuery || badgedFilter !== null 
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par ajouter votre premier client'}
                </p>
                
                {(searchQuery || badgedFilter !== null) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setBadgedFilter(null);
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
                      <TableHead>Nom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Ventes</TableHead>
                      <TableHead className="text-right">Réparations</TableHead>
                      <TableHead>Dernier achat</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openViewCustomerDialog(customer)}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm">
                              <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail className="h-3.5 w-3.5 mr-1" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.isBadged ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Privilégié
                            </Badge>
                          ) : (
                            <span className="text-gray-500">Standard</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{customer.salesCount || 0}</TableCell>
                        <TableCell className="text-right">{customer.repairsCount || 0}</TableCell>
                        <TableCell>
                          {customer.lastPurchase 
                            ? customer.lastPurchase.toLocaleDateString() 
                            : 'Jamais'
                          }
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                              <DropdownMenuItem onClick={() => openViewCustomerDialog(customer)}>
                                <User className="h-4 w-4 mr-2" /> Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                                <Edit className="h-4 w-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openDeleteDialog(customer)}
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
          
          {!loading && filteredCustomers.length > 0 && (
            <CardFooter className="border-t py-4 flex justify-between">
              <div className="text-sm text-gray-500">
                Affichage de {filteredCustomers.length} client(s) sur {customers.length} au total
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du client*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone*</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="edit-isBadged" 
                checked={formData.isBadged}
                onCheckedChange={(checked) => 
                  setFormData({...formData, isBadged: checked === true})
                }
              />
              <Label htmlFor="edit-isBadged">Client privilégié</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsEditDialogOpen(false);
            }}>
              Annuler
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={isSubmitting}>
              {isSubmitting ? 'En cours...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {currentCustomer && ((currentCustomer.salesCount && currentCustomer.salesCount > 0) || 
              (currentCustomer.repairsCount && currentCustomer.repairsCount > 0)) && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-700">
                    Ce client a des ventes ({currentCustomer.salesCount}) ou des réparations ({currentCustomer.repairsCount}) associées.
                    Impossible de le supprimer.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="py-4">
            <p><strong>Nom:</strong> {currentCustomer?.name}</p>
            <p><strong>Téléphone:</strong> {currentCustomer?.phone}</p>
            {currentCustomer?.email && <p><strong>Email:</strong> {currentCustomer.email}</p>}
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
              onClick={handleDeleteCustomer} 
              disabled={isSubmitting || 
                (currentCustomer && ((currentCustomer.salesCount && currentCustomer.salesCount > 0) || 
                (currentCustomer.repairsCount && currentCustomer.repairsCount > 0)))}
            >
              {isSubmitting ? 'En cours...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Customer Details Dialog */}
      <Dialog 
        open={isViewCustomerDialogOpen} 
        onOpenChange={setIsViewCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Détails du client
            </DialogTitle>
            <DialogDescription>
              Informations complètes et historique du client
            </DialogDescription>
          </DialogHeader>
          
          {currentCustomer && (
            <div className="space-y-6 py-4">
              {/* Customer Info Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{currentCustomer.name}</h2>
                      <div className="mt-1 space-y-1 text-sm">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {currentCustomer.phone}
                        </div>
                        {currentCustomer.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            {currentCustomer.email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {currentCustomer.isBadged ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
                          Client privilégié
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200 mb-2">
                          Client standard
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(currentCustomer)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <ShoppingBag className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total des ventes</p>
                      <h3 className="text-2xl font-bold">{currentCustomer.salesCount || 0}</h3>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <Wrench className="h-6 w-6 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Réparations</p>
                      <h3 className="text-2xl font-bold">{currentCustomer.repairsCount || 0}</h3>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <ShoppingBag className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dernier achat</p>
                      <h3 className="text-lg font-bold">
                        {currentCustomer.lastPurchase 
                          ? currentCustomer.lastPurchase.toLocaleDateString() 
                          : 'Jamais'
                        }
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Sales */}
              <div>
                <h3 className="text-lg font-medium mb-3">Ventes récentes</h3>
                {customerSales.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Aucune vente enregistrée</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="text-right">Payé</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerSales.slice(0, 5).map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell className="font-medium">{sale.id.substring(0, 6)}</TableCell>
                              <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {sale.saleType === 'direct' && 'Vente directe'}
                                {sale.saleType === 'installment' && 'Vente en tranches'}
                                {sale.saleType === 'partialPaid' && '80% payé'}
                                {sale.saleType === 'deliveredNotPaid' && 'Livré non payé'}
                                {sale.saleType === 'trade' && 'Troc'}
                              </TableCell>
                              <TableCell className="text-right">{sale.totalAmount} €</TableCell>
                              <TableCell className="text-right">{sale.paidAmount} €</TableCell>
                              <TableCell>{getSaleStatusBadge(sale.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Recent Repairs */}
              <div>
                <h3 className="text-lg font-medium mb-3">Réparations récentes</h3>
                {customerRepairs.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Aucune réparation enregistrée</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Appareil</TableHead>
                            <TableHead>Problème</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerRepairs.slice(0, 5).map((repair) => (
                            <TableRow key={repair.id}>
                              <TableCell className="font-medium">{repair.id.substring(0, 6)}</TableCell>
                              <TableCell>{new Date(repair.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{repair.deviceBrand} {repair.deviceModel}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{repair.issueDescription}</TableCell>
                              <TableCell>{getRepairStatusBadge(repair.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewCustomerDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
