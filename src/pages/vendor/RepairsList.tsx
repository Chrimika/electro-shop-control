
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Plus, 
  Search, 
  Smartphone, 
  Laptop, 
  Wrench,
  CheckCircle,
  Clock 
} from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db, collection, query, where, getDocs, addDoc, serverTimestamp } from '../../lib/firebase';
import { RepairRequest, Customer } from '../../types';
import { toast } from 'sonner';

const RepairsList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // New repair form state
  const [showNewRepairDialog, setShowNewRepairDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deviceType, setDeviceType] = useState<'phone' | 'computer' | 'other'>('phone');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.storeId) return;
      
      try {
        setLoading(true);
        
        // Fetch repairs
        const repairsQuery = query(
          collection(db, 'repairs'),
          where('storeId', '==', currentUser.storeId)
        );
        
        const repairDocs = await getDocs(repairsQuery);
        const repairsData = repairDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as RepairRequest));
        
        setRepairs(repairsData);
        
        // Fetch customers
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
  }, [currentUser]);
  
  const filteredRepairs = repairs.filter(repair => {
    // Text search
    const matchesSearch = 
      searchQuery === '' ||
      repair.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    switch(activeTab) {
      case 'pending':
        return matchesSearch && repair.status === 'pending';
      case 'diagnosed':
        return matchesSearch && repair.status === 'diagnosed';
      case 'repairing':
        return matchesSearch && repair.status === 'repairing';
      case 'completed':
        return matchesSearch && repair.status === 'completed';
      case 'cancelled':
        return matchesSearch && repair.status === 'cancelled';
      case 'all':
      default:
        return matchesSearch;
    }
  });
  
  const filteredCustomers = customerSearch
    ? customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch)
      )
    : customers;
  
  const getStatusBadge = (status: string) => {
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
  
  const getDeviceIcon = (type: string) => {
    switch(type) {
      case 'phone':
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'computer':
        return <Laptop className="h-5 w-5 text-green-500" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getRepairTabCount = (status: string) => {
    if (status === 'all') return repairs.length;
    return repairs.filter(repair => repair.status === status).length;
  };
  
  const resetNewRepairForm = () => {
    setSelectedCustomer(null);
    setDeviceType('phone');
    setDeviceBrand('');
    setDeviceModel('');
    setIssueDescription('');
    setCustomerSearch('');
  };
  
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSelect(false);
  };
  
  const handleCreateRepair = async () => {
    if (!selectedCustomer) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    
    if (!deviceBrand) {
      toast.error('Veuillez spécifier la marque de l\'appareil');
      return;
    }
    
    if (!deviceModel) {
      toast.error('Veuillez spécifier le modèle de l\'appareil');
      return;
    }
    
    if (!issueDescription) {
      toast.error('Veuillez décrire le problème');
      return;
    }
    
    try {
      if (!currentUser?.storeId) {
        toast.error('Erreur d\'identification du magasin');
        return;
      }
      
      const repairData = {
        storeId: currentUser.storeId,
        customerId: selectedCustomer.id,
        deviceType,
        deviceBrand,
        deviceModel,
        issueDescription,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'repairs'), repairData);
      toast.success('Demande de réparation enregistrée');
      
      // Reset form and close dialog
      resetNewRepairForm();
      setShowNewRepairDialog(false);
      
      // Refresh repairs list
      const repairsQuery = query(
        collection(db, 'repairs'),
        where('storeId', '==', currentUser.storeId)
      );
      
      const repairDocs = await getDocs(repairsQuery);
      const repairsData = repairDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as RepairRequest));
      
      setRepairs(repairsData);
    } catch (err) {
      console.error('Erreur lors de la création de la réparation:', err);
      toast.error('Erreur lors de la création de la réparation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2" 
              onClick={() => navigate('/vendor/dashboard')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <h1 className="text-3xl font-bold">Réparations</h1>
          </div>
          
          <Button onClick={() => setShowNewRepairDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle réparation
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des réparations</CardTitle>
            <CardDescription>Gérer les demandes de réparation</CardDescription>
            
            <div className="mt-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher une réparation..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
                <TabsTrigger value="all">
                  Toutes ({getRepairTabCount('all')})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  En attente ({getRepairTabCount('pending')})
                </TabsTrigger>
                <TabsTrigger value="diagnosed">
                  Diagnostiquées ({getRepairTabCount('diagnosed')})
                </TabsTrigger>
                <TabsTrigger value="repairing">
                  En cours ({getRepairTabCount('repairing')})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Terminées ({getRepairTabCount('completed')})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Annulées ({getRepairTabCount('cancelled')})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                ) : filteredRepairs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucune réparation trouvée</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRepairs.map((repair) => (
                      <Card 
                        key={repair.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/vendor/repairs/${repair.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              {getDeviceIcon(repair.deviceType)}
                              <h3 className="font-medium ml-2">{repair.deviceBrand} {repair.deviceModel}</h3>
                            </div>
                            {getStatusBadge(repair.status)}
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{repair.issueDescription}</p>
                          
                          {repair.status === 'diagnosed' && (
                            <div className="flex justify-between text-sm mb-3">
                              <span>Coût estimé: {repair.estimatedCost} €</span>
                              <span>Durée: {repair.estimatedDuration}h</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Client: {repair.customerId}</span>
                            <span>
                              {repair.status === 'completed' ? (
                                <span className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                  {repair.completedAt ? new Date(repair.completedAt).toLocaleDateString() : 'Terminé'}
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Créé le: {new Date(repair.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* New Repair Dialog */}
        <Dialog open={showNewRepairDialog} onOpenChange={setShowNewRepairDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle demande de réparation</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle demande de réparation pour un client
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Customer selection */}
              {selectedCustomer ? (
                <div className="mb-4 p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                      {selectedCustomer.email && (
                        <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Changer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Client</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Rechercher un client..." 
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerSelect(true);
                      }}
                      onClick={() => setShowCustomerSelect(true)}
                    />
                  </div>
                  
                  {showCustomerSelect && (
                    <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-center p-2 text-sm text-gray-500">
                          Aucun client trouvé
                        </p>
                      ) : (
                        filteredCustomers.map(customer => (
                          <div 
                            key={customer.id} 
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-gray-600">{customer.phone}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Device details */}
              <div className="space-y-2">
                <Label htmlFor="deviceType">Type d'appareil</Label>
                <Select value={deviceType} onValueChange={(value: 'phone' | 'computer' | 'other') => setDeviceType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type d'appareil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Téléphone / Tablette</SelectItem>
                    <SelectItem value="computer">Ordinateur</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceBrand">Marque</Label>
                  <Input 
                    id="deviceBrand"
                    placeholder="Apple, Samsung, HP..."
                    value={deviceBrand}
                    onChange={(e) => setDeviceBrand(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Modèle</Label>
                  <Input 
                    id="deviceModel"
                    placeholder="iPhone 12, Galaxy S21..."
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issueDescription">Description du problème</Label>
                <Textarea
                  id="issueDescription"
                  placeholder="Décrivez le problème de l'appareil..."
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetNewRepairForm();
                  setShowNewRepairDialog(false);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleCreateRepair}>
                Enregistrer la demande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default RepairsList;
