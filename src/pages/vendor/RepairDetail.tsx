
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  Smartphone, 
  Laptop, 
  Wrench, 
  AlertTriangle, 
  User, 
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  X
} from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db, doc, getDoc, updateDoc } from '../../lib/firebase';
import { RepairRequest, Customer } from '../../types';
import { toast } from 'sonner';

const RepairDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [repair, setRepair] = useState<RepairRequest | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  useEffect(() => {
    const fetchRepair = async () => {
      if (!id || !currentUser) return;
      
      try {
        setLoading(true);
        const repairDoc = await getDoc(doc(db, 'repairs', id));
        
        if (!repairDoc.exists()) {
          setError('Réparation non trouvée');
          setLoading(false);
          return;
        }
        
        const repairData = {
          id: repairDoc.id,
          ...repairDoc.data(),
          createdAt: repairDoc.data().createdAt?.toDate() || new Date(),
          completedAt: repairDoc.data().completedAt?.toDate()
        } as RepairRequest;
        
        if (repairData.storeId !== currentUser.storeId) {
          setError('Vous n\'avez pas accès à cette réparation');
          setLoading(false);
          return;
        }
        
        setRepair(repairData);
        
        // Fetch customer
        if (repairData.customerId) {
          const customerDoc = await getDoc(doc(db, 'customers', repairData.customerId));
          if (customerDoc.exists()) {
            setCustomer({
              id: customerDoc.id,
              ...customerDoc.data()
            } as Customer);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de la réparation:', err);
        setError('Erreur lors du chargement de la réparation');
        setLoading(false);
      }
    };
    
    fetchRepair();
  }, [id, currentUser]);
  
  const handleCancelRepair = async () => {
    if (!repair || !cancellationReason) return;
    
    try {
      await updateDoc(doc(db, 'repairs', repair.id), {
        status: 'cancelled',
        cancellationReason,
        cancelledAt: new Date()
      });
      
      setRepair({
        ...repair,
        status: 'cancelled',
        cancellationReason
      });
      
      setShowCancelDialog(false);
      toast.success('Réparation annulée avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la réparation:', err);
      toast.error('Erreur lors de l\'annulation de la réparation');
    }
  };
  
  const getDeviceIcon = (type: string) => {
    switch(type) {
      case 'phone':
        return <Smartphone className="h-6 w-6 text-blue-500" />;
      case 'computer':
        return <Laptop className="h-6 w-6 text-green-500" />;
      default:
        return <Wrench className="h-6 w-6 text-gray-500" />;
    }
  };
  
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
  
  const getDeviceTypeLabel = (type: string) => {
    switch(type) {
      case 'phone':
        return 'Téléphone / Tablette';
      case 'computer':
        return 'Ordinateur';
      default:
        return 'Autre';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VendorHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !repair) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VendorHeader />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Erreur</CardTitle>
              <CardDescription>{error || 'Une erreur est survenue'}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/vendor/repairs')}>Retour aux réparations</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate('/vendor/repairs')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Détails de la réparation</h1>
        </div>
        
        {/* Repair Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  {getDeviceIcon(repair.deviceType)}
                  <span className="ml-2">
                    {repair.deviceBrand} {repair.deviceModel}
                  </span>
                </CardTitle>
                <CardDescription>{getDeviceTypeLabel(repair.deviceType)}</CardDescription>
              </div>
              <div>{getStatusBadge(repair.status)}</div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description du problème</h3>
                <p className="text-gray-700">{repair.issueDescription}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date de création</h3>
                  <p>{new Date(repair.createdAt).toLocaleDateString()} à {new Date(repair.createdAt).toLocaleTimeString()}</p>
                </div>
                
                {repair.status === 'completed' && repair.completedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date de fin</h3>
                    <p>{new Date(repair.completedAt).toLocaleDateString()} à {new Date(repair.completedAt).toLocaleTimeString()}</p>
                  </div>
                )}
              </div>
              
              {repair.status === 'diagnosed' && (
                <>
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Diagnostic</h3>
                    <p className="text-gray-700">{repair.diagnosisNotes || 'Aucune note de diagnostic disponible.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Coût estimé</h3>
                      <p className="font-medium">{repair.estimatedCost} €</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Durée estimée</h3>
                      <p className="font-medium">{repair.estimatedDuration} heures</p>
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Réparation diagnostiquée</AlertTitle>
                    <AlertDescription>
                      Un réparateur a examiné l'appareil et a fourni une estimation. Vous pouvez informer le client.
                    </AlertDescription>
                  </Alert>
                </>
              )}
              
              {repair.status === 'repairing' && (
                <Alert className="bg-purple-50 border-purple-200">
                  <Wrench className="h-4 w-4 text-purple-600" />
                  <AlertTitle>Réparation en cours</AlertTitle>
                  <AlertDescription>
                    L'appareil est actuellement en réparation. Durée estimée: {repair.estimatedDuration} heures.
                  </AlertDescription>
                </Alert>
              )}
              
              {repair.status === 'completed' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Réparation terminée</AlertTitle>
                  <AlertDescription>
                    La réparation a été effectuée avec succès. L'appareil est prêt à être récupéré.
                  </AlertDescription>
                </Alert>
              )}
              
              {repair.status === 'cancelled' && (
                <Alert className="bg-red-50 border-red-200">
                  <X className="h-4 w-4 text-red-600" />
                  <AlertTitle>Réparation annulée</AlertTitle>
                  <AlertDescription>
                    Raison: {repair.cancellationReason || 'Non spécifiée'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => window.print()}
              >
                <FileText className="h-4 w-4 mr-2" /> Imprimer
              </Button>
              
              {repair.status !== 'cancelled' && repair.status !== 'completed' && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="h-4 w-4 mr-2" /> Annuler la réparation
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Customer Info and Status Tracking */}
          <div className="space-y-6">
            {/* Customer info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer ? (
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {customer.name}</p>
                    <p><span className="font-medium">Téléphone:</span> {customer.phone}</p>
                    {customer.email && <p><span className="font-medium">Email:</span> {customer.email}</p>}
                    <p>
                      <span className="font-medium">Client fidèle:</span> 
                      {customer.isBadged ? (
                        <Badge className="ml-2 bg-purple-100 text-purple-800">Oui</Badge>
                      ) : (
                        <span className="ml-2">Non</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Informations client non disponibles</p>
                )}
              </CardContent>
              {customer && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/vendor/customers/${customer.id}`)}
                  >
                    Voir le profil client
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {/* Status Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Suivi de réparation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute h-full w-px bg-gray-200 left-3 top-0"></div>
                  
                  <div className="space-y-6 relative">
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10
                        ${repair.status !== 'cancelled' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}
                      >
                        <CheckCircle className={`h-4 w-4 
                          ${repair.status !== 'cancelled' ? 'text-green-600' : 'text-red-600'}`} 
                        />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Demande reçue</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(repair.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10
                        ${repair.status === 'diagnosed' || repair.status === 'repairing' || repair.status === 'completed' 
                          ? 'bg-green-100 border-green-200' 
                          : repair.status === 'cancelled' 
                            ? 'bg-red-100 border-red-200' 
                            : 'bg-gray-100 border-gray-200'}`}
                      >
                        {repair.status === 'diagnosed' || repair.status === 'repairing' || repair.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : repair.status === 'cancelled' ? (
                          <X className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Diagnostic</h4>
                        {repair.status === 'diagnosed' || repair.status === 'repairing' || repair.status === 'completed' ? (
                          <p className="text-sm text-gray-500">Complété</p>
                        ) : repair.status === 'cancelled' ? (
                          <p className="text-sm text-red-500">Annulé</p>
                        ) : (
                          <p className="text-sm text-gray-500">En attente</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10
                        ${repair.status === 'repairing' || repair.status === 'completed' 
                          ? 'bg-green-100 border-green-200' 
                          : repair.status === 'cancelled' 
                            ? 'bg-red-100 border-red-200' 
                            : 'bg-gray-100 border-gray-200'}`}
                      >
                        {repair.status === 'repairing' || repair.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : repair.status === 'cancelled' ? (
                          <X className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Réparation</h4>
                        {repair.status === 'repairing' ? (
                          <p className="text-sm text-blue-500">En cours</p>
                        ) : repair.status === 'completed' ? (
                          <p className="text-sm text-gray-500">Complétée</p>
                        ) : repair.status === 'cancelled' ? (
                          <p className="text-sm text-red-500">Annulée</p>
                        ) : (
                          <p className="text-sm text-gray-500">En attente</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10
                        ${repair.status === 'completed' 
                          ? 'bg-green-100 border-green-200' 
                          : repair.status === 'cancelled' 
                            ? 'bg-red-100 border-red-200' 
                            : 'bg-gray-100 border-gray-200'}`}
                      >
                        {repair.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : repair.status === 'cancelled' ? (
                          <X className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Finalisation</h4>
                        {repair.status === 'completed' ? (
                          <p className="text-sm text-gray-500">Terminé le {repair.completedAt && new Date(repair.completedAt).toLocaleDateString()}</p>
                        ) : repair.status === 'cancelled' ? (
                          <p className="text-sm text-red-500">Annulé</p>
                        ) : (
                          <p className="text-sm text-gray-500">En attente</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {repair.status === 'diagnosed' && (
                <CardFooter>
                  <div className="w-full">
                    <p className="text-sm text-gray-500 mb-2">Prix estimé</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">{repair.estimatedCost} €</span>
                      <Button size="sm">
                        <DollarSign className="h-4 w-4 mr-2" /> Facturer
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
        
        {/* Cancel Repair Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Annuler la réparation</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Veuillez fournir une raison pour l'annulation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Raison de l'annulation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelRepair}
                disabled={!cancellationReason}
              >
                Confirmer l'annulation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default RepairDetail;
