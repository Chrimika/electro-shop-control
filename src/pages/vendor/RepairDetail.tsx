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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Textarea 
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  AlertCircle,
  Phone,
  User as UserIcon,
  Package,
  Clock,
  CalendarCheck,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, doc, getDoc, updateDoc, serverTimestamp } from '../../lib/firebase';
import { toast } from 'sonner';
import { RepairRequest } from '../../types';
import VendorHeader from '@/components/vendor/VendorHeader';

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [repair, setRepair] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [repairerName, setRepairerName] = useState('');
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'diagnosed' | 'repairing' | 'completed' | 'cancelled'>('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    const fetchRepairDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const repairDoc = await getDoc(doc(db, 'repairs', id));
        
        if (repairDoc.exists()) {
          const repairData = {
            id: repairDoc.id,
            ...repairDoc.data(),
          } as RepairRequest;
          
          setRepair(repairData);
          setNewStatus(repairData.status);
          
          // Fetch customer name
          if (repairData.customerId) {
            const customerDoc = await getDoc(doc(db, 'customers', repairData.customerId));
            if (customerDoc.exists()) {
              setCustomerName(customerDoc.data().name);
            }
          }
          
          // Fetch repairer name if assigned
          if (repairData.repairerId) {
            const repairerDoc = await getDoc(doc(db, 'users', repairData.repairerId));
            if (repairerDoc.exists()) {
              setRepairerName(repairerDoc.data().displayName);
            }
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
  
  const handleUpdateStatus = async () => {
    if (!repair || !id) return;
    
    try {
      setIsUpdating(true);
      
      const updateData: Partial<RepairRequest> = {
        status: newStatus
      };
      
      // If status is being set to completed, add completedAt
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }
      
      await updateDoc(doc(db, 'repairs', id), updateData);
      
      setRepair({
        ...repair,
        ...updateData,
        completedAt: updateData.completedAt || repair.completedAt
      });
      
      toast.success('Statut mis à jour avec succès');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repair Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                Informations sur la réparation
              </CardTitle>
              <CardDescription>
                Détails de la demande de réparation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Client</p>
                  <p className="font-medium">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Statut</p>
                  {getStatusBadge(repair.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Type d'appareil</p>
                  <p className="font-medium">{repair.deviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Marque</p>
                  <p className="font-medium">{repair.deviceBrand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Modèle</p>
                  <p className="font-medium">{repair.deviceModel}</p>
                </div>
                {repair.repairerId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Réparateur assigné</p>
                    <p className="font-medium">{repairerName}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description du problème</p>
                <p className="font-medium">{repair.issueDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Update Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Mettre à jour le statut
              </CardTitle>
              <CardDescription>
                Modifier l'état actuel de la réparation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Nouveau statut</p>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as 'pending' | 'diagnosed' | 'repairing' | 'completed' | 'cancelled')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="diagnosed">Diagnostiqué</SelectItem>
                      <SelectItem value="repairing">En réparation</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <Textarea
                    placeholder="Ajouter des notes sur la réparation"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                  {isUpdating ? 'Mise à jour...' : 'Mettre à jour le statut'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RepairDetail;
