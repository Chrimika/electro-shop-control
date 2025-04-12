
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  Clock, 
  Tool, 
  PenBox,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Euro
} from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db, doc, getDoc, updateDoc } from '../../lib/firebase';
import { RepairRequest } from '../../types';
import { toast } from 'sonner';

interface ExtendedRepairRequest extends RepairRequest {
  diagnosisNotes?: string;
  cancellationReason?: string;
}

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [repair, setRepair] = useState<ExtendedRepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [repairDuration, setRepairDuration] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  useEffect(() => {
    const fetchRepairDetails = async () => {
      if (!id) return;
      
      try {
        const repairDoc = await getDoc(doc(db, 'repairs', id));
        
        if (repairDoc.exists()) {
          const repairData = {
            id: repairDoc.id,
            ...repairDoc.data(),
            createdAt: repairDoc.data().createdAt?.toDate() || new Date()
          } as ExtendedRepairRequest;
          
          setRepair(repairData);
          
          // Initialize form values if available
          if (repairData.estimatedDuration) {
            setRepairDuration(repairData.estimatedDuration.toString());
          }
          if (repairData.estimatedCost) {
            setRepairCost(repairData.estimatedCost.toString());
          }
          if (repairData.diagnosisNotes) {
            setDiagnosisNotes(repairData.diagnosisNotes);
          }
        } else {
          toast.error('Réparation non trouvée');
          navigate('/vendor/repairs');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des détails de la réparation:', err);
        toast.error('Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepairDetails();
  }, [id, navigate]);
  
  const handleUpdateRepairStatus = async (newStatus: string) => {
    if (!repair || !id) return;
    
    try {
      setIsUpdating(true);
      
      const updates: Record<string, any> = { status: newStatus };
      
      // Add additional fields based on the new status
      if (newStatus === 'diagnosed') {
        if (!diagnosisNotes) {
          toast.error('Veuillez ajouter des notes de diagnostic');
          setIsUpdating(false);
          return;
        }
        updates.diagnosisNotes = diagnosisNotes;
        updates.estimatedDuration = repairDuration ? parseInt(repairDuration) : 0;
        updates.estimatedCost = repairCost ? parseFloat(repairCost) : 0;
      } else if (newStatus === 'cancelled') {
        if (!cancellationReason) {
          toast.error('Veuillez indiquer la raison de l\'annulation');
          setIsUpdating(false);
          return;
        }
        updates.cancellationReason = cancellationReason;
        updates.cancellationDate = new Date();
      } else if (newStatus === 'completed') {
        updates.completedAt = new Date();
      }
      
      await updateDoc(doc(db, 'repairs', id), updates);
      
      // Update local state
      setRepair({ ...repair, ...updates, status: newStatus });
      toast.success('Statut de la réparation mis à jour');
      
      // Close cancel dialog if open
      setShowCancelDialog(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VendorHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VendorHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Réparation non trouvée</h2>
            <p className="text-gray-500 mb-6">La réparation que vous recherchez n'existe pas ou a été supprimée.</p>
            <Button onClick={() => navigate('/vendor/repairs')}>
              Retour à la liste des réparations
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
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={() => navigate('/vendor/repairs')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Détails de la réparation</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main repair info */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Demande #{repair.id.substring(0, 6)}</CardTitle>
                {getStatusBadge(repair.status)}
              </div>
              <CardDescription>Créée le {repair.createdAt.toLocaleDateString()}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Type d'appareil</TableCell>
                    <TableCell>
                      {repair.deviceType === 'phone' && 'Téléphone'}
                      {repair.deviceType === 'computer' && 'Ordinateur'}
                      {repair.deviceType === 'other' && 'Autre'}
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Marque</TableCell>
                    <TableCell>{repair.deviceBrand}</TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Modèle</TableCell>
                    <TableCell>{repair.deviceModel}</TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Description du problème</TableCell>
                    <TableCell className="whitespace-pre-wrap">{repair.issueDescription}</TableCell>
                  </TableRow>
                  
                  {repair.diagnosisNotes && (
                    <TableRow>
                      <TableCell className="font-medium">Notes de diagnostic</TableCell>
                      <TableCell className="whitespace-pre-wrap">{repair.diagnosisNotes}</TableCell>
                    </TableRow>
                  )}
                  
                  {repair.estimatedDuration !== undefined && (
                    <TableRow>
                      <TableCell className="font-medium">Durée estimée</TableCell>
                      <TableCell>{repair.estimatedDuration} heure(s)</TableCell>
                    </TableRow>
                  )}
                  
                  {repair.estimatedCost !== undefined && (
                    <TableRow>
                      <TableCell className="font-medium">Coût estimé</TableCell>
                      <TableCell>{repair.estimatedCost} €</TableCell>
                    </TableRow>
                  )}
                  
                  {repair.status === 'cancelled' && repair.cancellationReason && (
                    <TableRow>
                      <TableCell className="font-medium">Raison de l'annulation</TableCell>
                      <TableCell>{repair.cancellationReason}</TableCell>
                    </TableRow>
                  )}
                  
                  {repair.completedAt && (
                    <TableRow>
                      <TableCell className="font-medium">Date de finalisation</TableCell>
                      <TableCell>{repair.completedAt.toLocaleDateString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Action card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Gérer la demande de réparation</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Different actions based on status */}
              {repair.status === 'pending' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Diagnostic</h3>
                    <Textarea 
                      placeholder="Notes de diagnostic" 
                      className="h-32"
                      value={diagnosisNotes}
                      onChange={(e) => setDiagnosisNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="duration">Durée estimée (heures)</Label>
                        <Input 
                          id="duration" 
                          type="number" 
                          min="0"
                          value={repairDuration}
                          onChange={(e) => setRepairDuration(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cost">Coût estimé (€)</Label>
                        <Input 
                          id="cost" 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={repairCost}
                          onChange={(e) => setRepairCost(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleUpdateRepairStatus('diagnosed')}
                    disabled={isUpdating}
                  >
                    <PenBox className="h-4 w-4 mr-2" /> 
                    Enregistrer le diagnostic
                  </Button>
                </div>
              )}
              
              {repair.status === 'diagnosed' && (
                <Button 
                  className="w-full"
                  onClick={() => handleUpdateRepairStatus('repairing')}
                  disabled={isUpdating}
                >
                  <Tool className="h-4 w-4 mr-2" /> 
                  Commencer la réparation
                </Button>
              )}
              
              {repair.status === 'repairing' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateRepairStatus('completed')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> 
                  Marquer comme terminée
                </Button>
              )}
              
              {['pending', 'diagnosed', 'repairing'].includes(repair.status) && (
                <>
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> 
                    Annuler la réparation
                  </Button>
                </>
              )}
              
              {repair.status === 'completed' && (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <p>Cette réparation a été complétée avec succès.</p>
                </div>
              )}
              
              {repair.status === 'cancelled' && (
                <div className="text-center space-y-2">
                  <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                  <p>Cette réparation a été annulée.</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" /> Imprimer la fiche
                </Button>
                
                {repair.status === 'completed' && (
                  <Button className="w-full">
                    <Euro className="h-4 w-4 mr-2" /> Facturer au client
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réparation</DialogTitle>
            <DialogDescription>
              Cette action ne peut pas être annulée. La réparation sera marquée comme annulée.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <Label htmlFor="cancellationReason">Raison de l'annulation</Label>
            <Textarea 
              id="cancellationReason" 
              placeholder="Veuillez indiquer pourquoi cette réparation est annulée"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateRepairStatus('cancelled')}
              disabled={isUpdating || !cancellationReason}
            >
              {isUpdating ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Traitement...
                </>
              ) : (
                'Confirmer l\'annulation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepairDetail;
