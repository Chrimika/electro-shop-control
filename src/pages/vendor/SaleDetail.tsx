
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Check, ChevronLeft, DollarSign, Printer, ShoppingBag, User, X } from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db, doc, getDoc, updateDoc } from '../../lib/firebase';
import { Sale, Customer, SaleItem } from '../../types';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  useEffect(() => {
    const fetchSale = async () => {
      if (!id || !currentUser) return;
      
      try {
        setLoading(true);
        const saleDoc = await getDoc(doc(db, 'sales', id));
        
        if (!saleDoc.exists()) {
          setError('Vente non trouvée');
          setLoading(false);
          return;
        }
        
        const saleData = {
          id: saleDoc.id,
          ...saleDoc.data(),
          createdAt: saleDoc.data().createdAt?.toDate() || new Date()
        } as Sale;
        
        if (saleData.storeId !== currentUser.storeId) {
          setError('Vous n\'avez pas accès à cette vente');
          setLoading(false);
          return;
        }
        
        setSale(saleData);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de la vente:', err);
        setError('Erreur lors du chargement de la vente');
        setLoading(false);
      }
    };
    
    fetchSale();
  }, [id, currentUser]);
  
  const handleAddPayment = async () => {
    if (!sale || paymentAmount <= 0) return;
    
    try {
      const newPaidAmount = sale.paidAmount + paymentAmount;
      const newStatus = newPaidAmount >= sale.totalAmount ? 'completed' : 'pending';
      
      await updateDoc(doc(db, 'sales', sale.id), {
        paidAmount: newPaidAmount,
        status: newStatus,
        lastPaymentDate: new Date()
      });
      
      setSale({
        ...sale,
        paidAmount: newPaidAmount,
        status: newStatus
      });
      
      setPaymentAmount(0);
      toast.success('Paiement enregistré avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du paiement:', err);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };
  
  const handleCancelSale = async () => {
    if (!sale) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette vente ?')) {
      try {
        await updateDoc(doc(db, 'sales', sale.id), {
          status: 'cancelled',
          cancellationReason: 'Annulée par le vendeur',
          cancellationDate: new Date()
        });
        
        setSale({
          ...sale,
          status: 'cancelled'
        });
        
        toast.success('Vente annulée avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'annulation de la vente:', err);
        toast.error('Erreur lors de l\'annulation de la vente');
      }
    }
  };
  
  const getSaleTypeLabel = (type: string) => {
    switch(type) {
      case 'direct':
        return 'Vente directe';
      case 'installment':
        return 'Vente en tranches';
      case 'partialPaid':
        return '80% payé';
      case 'deliveredNotPaid':
        return 'Livré non payé';
      case 'trade':
        return 'Troc';
      default:
        return type;
    }
  };
  
  const getStatusBadge = (status: string) => {
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
  
  if (error || !sale) {
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
              <Button onClick={() => navigate('/vendor/sales')}>Retour aux ventes</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }
  
  const remainingAmount = sale.totalAmount - sale.paidAmount;

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate('/vendor/sales')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Détails de la vente</h1>
        </div>
        
        {/* Sale Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Vente #{sale.id.substring(0, 6)}
                </CardTitle>
                <CardDescription>{getSaleTypeLabel(sale.saleType)}</CardDescription>
              </div>
              <div>{getStatusBadge(sale.status)}</div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Date de vente</p>
                  <p className="font-medium">
                    {new Date(sale.createdAt).toLocaleDateString()} à {new Date(sale.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Vendeur</p>
                  <p className="font-medium">{currentUser?.displayName || 'Inconnu'}</p>
                </div>
                
                {sale.deadline && (
                  <div>
                    <p className="text-sm text-gray-500">Date limite de paiement</p>
                    <p className="font-medium">
                      {new Date(sale.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="font-medium mb-3">Produits achetés</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unitPrice} €</TableCell>
                      <TableCell className="text-right">{item.totalPrice} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span>{sale.totalAmount} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{sale.totalAmount} €</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Payé:</span>
                    <span>{sale.paidAmount} €</span>
                  </div>
                  {remainingAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Restant:</span>
                      <span>{remainingAmount} €</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" /> Imprimer
              </Button>
              
              {sale.status !== 'cancelled' && sale.status !== 'completed' && (
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSale}
                >
                  <X className="h-4 w-4 mr-2" /> Annuler la vente
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Customer and Payment Section */}
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
                {sale.customer ? (
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {sale.customer.name}</p>
                    <p><span className="font-medium">Téléphone:</span> {sale.customer.phone}</p>
                    {sale.customer.email && <p><span className="font-medium">Email:</span> {sale.customer.email}</p>}
                    <p>
                      <span className="font-medium">Client fidèle:</span> 
                      {sale.customer.isBadged ? (
                        <Badge className="ml-2 bg-purple-100 text-purple-800">Oui</Badge>
                      ) : (
                        <span className="ml-2">Non</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Client anonyme</p>
                )}
              </CardContent>
              {sale.customer && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/vendor/customers/${sale.customer?.id}`)}
                  >
                    Voir le profil client
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {/* Payment section */}
            {sale.status === 'pending' && remainingAmount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Ajouter un paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="paymentAmount" className="block text-sm font-medium mb-1">
                        Montant (€)
                      </label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        max={remainingAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleAddPayment}
                      disabled={paymentAmount <= 0 || paymentAmount > remainingAmount}
                    >
                      <Check className="h-4 w-4 mr-2" /> Enregistrer le paiement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SaleDetail;
