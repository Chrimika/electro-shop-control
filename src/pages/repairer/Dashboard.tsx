
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Search, 
  CheckCircle, 
  Smartphone, 
  Laptop, 
  Tool, 
  Calendar, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';
import { db, collection, onSnapshot, query, where, orderBy, updateDoc, doc } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { RepairRequest } from '../../types';
import RepairerHeader from '@/components/repairer/RepairerHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const RepairerDashboard = () => {
  const { currentUser } = useAuth();
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Get repair type from user profile
    const repairType = currentUser.repairSpecialty || 'phone';
    
    // Query repairs that match the repairer's specialty
    const repairsQuery = query(
      collection(db, 'repairs'),
      where('deviceType', '==', repairType),
      where('status', 'in', ['pending', 'diagnosed', 'repairing']),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(repairsQuery, (snapshot) => {
      const repairsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RepairRequest));
      
      setRepairs(repairsData);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [currentUser]);
  
  const filteredRepairs = repairs.filter(repair => 
    repair.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase()) || 
    repair.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repair.issueDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelectRepair = (repair: RepairRequest) => {
    setSelectedRepair(repair);
    setDiagnosis('');
    setEstimatedCost(0);
    setEstimatedDuration(0);
  };
  
  const handleDiagnoseRepair = async () => {
    if (!selectedRepair) return;
    
    try {
      const repairRef = doc(db, 'repairs', selectedRepair.id);
      await updateDoc(repairRef, {
        status: 'diagnosed',
        repairerId: currentUser?.uid,
        estimatedCost,
        estimatedDuration,
        diagnosisNotes: diagnosis
      });
      
      toast.success('Diagnostic enregistré avec succès');
      setSelectedRepair(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du diagnostic:', error);
      toast.error('Erreur lors de l\'enregistrement du diagnostic');
    }
  };
  
  const handleCompleteRepair = async (repairId: string) => {
    try {
      const repairRef = doc(db, 'repairs', repairId);
      await updateDoc(repairRef, {
        status: 'completed',
        completedAt: new Date()
      });
      
      toast.success('Réparation marquée comme terminée');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réparation:', error);
      toast.error('Erreur lors de la mise à jour de la réparation');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'diagnosed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Diagnostiqué</Badge>;
      case 'repairing':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">En réparation</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getDeviceIcon = (type: string) => {
    switch(type) {
      case 'phone':
        return <Smartphone className="h-10 w-10 text-blue-500" />;
      case 'computer':
        return <Laptop className="h-10 w-10 text-green-500" />;
      default:
        return <Tool className="h-10 w-10 text-gray-500" />;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <RepairerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord des réparations</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">En attente</p>
                <h3 className="text-2xl font-bold">{repairs.filter(r => r.status === 'pending').length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Tool className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">En cours</p>
                <h3 className="text-2xl font-bold">
                  {repairs.filter(r => r.status === 'diagnosed' || r.status === 'repairing').length}
                </h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Complétées (ce mois)</p>
                <h3 className="text-2xl font-bold">12</h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Repairs List */}
          <div className="lg:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de réparation</CardTitle>
                <CardDescription>Gérez les appareils qui nécessitent une réparation</CardDescription>
                
                <div className="mt-4 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher un appareil..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="pending">En attente</TabsTrigger>
                    <TabsTrigger value="diagnosed">Diagnostiqués</TabsTrigger>
                    <TabsTrigger value="repairing">En réparation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending" className="space-y-4 mt-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-4"></div>
                        <p className="text-gray-500">Chargement des réparations...</p>
                      </div>
                    ) : filteredRepairs.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Aucune réparation en attente</p>
                      </div>
                    ) : (
                      filteredRepairs
                        .filter(r => r.status === 'pending')
                        .map(repair => (
                          <Card key={repair.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="flex items-start p-4">
                                <div className="mr-4 mt-1">
                                  {getDeviceIcon(repair.deviceType)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium text-lg">{repair.deviceBrand} {repair.deviceModel}</h3>
                                    {getStatusBadge(repair.status)}
                                  </div>
                                  <p className="text-gray-600 mb-3 line-clamp-2">{repair.issueDescription}</p>
                                  <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {new Date(repair.createdAt).toLocaleDateString()}
                                    </span>
                                    <Button size="sm" onClick={() => handleSelectRepair(repair)}>
                                      Diagnostiquer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="diagnosed" className="space-y-4 mt-4">
                    {filteredRepairs.filter(r => r.status === 'diagnosed').length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Aucune réparation diagnostiquée</p>
                      </div>
                    ) : (
                      filteredRepairs
                        .filter(r => r.status === 'diagnosed')
                        .map(repair => (
                          <Card key={repair.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start">
                                <div className="mr-4 mt-1">
                                  {getDeviceIcon(repair.deviceType)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium text-lg">{repair.deviceBrand} {repair.deviceModel}</h3>
                                    {getStatusBadge(repair.status)}
                                  </div>
                                  <p className="text-gray-600 mb-3 line-clamp-2">{repair.issueDescription}</p>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                    <div>
                                      <span className="text-gray-500 flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Prix estimé:
                                      </span>
                                      <span className="font-medium">{repair.estimatedCost} €</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        Durée estimée:
                                      </span>
                                      <span className="font-medium">{repair.estimatedDuration}h</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {new Date(repair.createdAt).toLocaleDateString()}
                                    </span>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleCompleteRepair(repair.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Terminer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="repairing" className="space-y-4 mt-4">
                    {filteredRepairs.filter(r => r.status === 'repairing').length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Aucune réparation en cours</p>
                      </div>
                    ) : (
                      <p>Liste des réparations en cours...</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Current Work */}
          <div className="lg:w-1/2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Planning de travail</CardTitle>
                <CardDescription>Vos réparations programmées pour aujourd'hui</CardDescription>
              </CardHeader>
              
              <CardContent className="h-[30rem] overflow-y-auto">
                <div className="space-y-6">
                  <div className="border-l-2 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium text-lg mb-1">9:00 - 10:30</h3>
                    <div className="flex items-center mb-2">
                      <Smartphone className="h-5 w-5 text-blue-500 mr-2" />
                      <span>iPhone 12 - Écran cassé</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      En cours
                    </Badge>
                  </div>
                  
                  <div className="border-l-2 border-gray-200 pl-4 py-2">
                    <h3 className="font-medium text-lg mb-1">11:00 - 12:30</h3>
                    <div className="flex items-center mb-2">
                      <Laptop className="h-5 w-5 text-green-500 mr-2" />
                      <span>MacBook Pro - Batterie défectueuse</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      À venir
                    </Badge>
                  </div>
                  
                  <div className="border-l-2 border-gray-200 pl-4 py-2">
                    <h3 className="font-medium text-lg mb-1">14:00 - 15:00</h3>
                    <div className="flex items-center mb-2">
                      <Smartphone className="h-5 w-5 text-blue-500 mr-2" />
                      <span>Samsung Galaxy S21 - Problème de charge</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      À venir
                    </Badge>
                  </div>
                  
                  <div className="border-l-2 border-gray-200 pl-4 py-2">
                    <h3 className="font-medium text-lg mb-1">15:30 - 17:00</h3>
                    <div className="flex items-center mb-2">
                      <Laptop className="h-5 w-5 text-green-500 mr-2" />
                      <span>Dell XPS - Ne démarre pas</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      À venir
                    </Badge>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" /> Voir le planning complet
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Diagnose Repair Dialog */}
      <Dialog open={!!selectedRepair} onOpenChange={(open) => !open && setSelectedRepair(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Diagnostic de réparation</DialogTitle>
            <DialogDescription>
              Entrez les détails du diagnostic pour cet appareil
            </DialogDescription>
          </DialogHeader>
          
          {selectedRepair && (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                {getDeviceIcon(selectedRepair.deviceType)}
                <div>
                  <h3 className="font-medium text-lg">{selectedRepair.deviceBrand} {selectedRepair.deviceModel}</h3>
                  <p className="text-gray-600">{selectedRepair.issueDescription}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnostic détaillé</Label>
                <Textarea 
                  id="diagnosis" 
                  placeholder="Décrivez le problème et la solution proposée..."
                  rows={4}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated-cost">Coût estimé (€)</Label>
                  <Input 
                    id="estimated-cost" 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-duration">Durée estimée (heures)</Label>
                  <Input 
                    id="estimated-duration" 
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRepair(null)}>
              Annuler
            </Button>
            <Button onClick={handleDiagnoseRepair}>
              Enregistrer le diagnostic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepairerDashboard;
