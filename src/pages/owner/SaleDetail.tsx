
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
import {
  ChevronLeft,
  Printer,
  FileText,
  ShoppingBag,
  User,
  Receipt,
  Store as StoreIcon,
  AlertCircle
} from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db, doc, getDoc } from '../../lib/firebase';
import { Sale } from '../../types';
import { toast } from 'sonner';

const OwnerSaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const saleDoc = await getDoc(doc(db, 'sales', id));

        if (saleDoc.exists()) {
          const saleData = {
            id: saleDoc.id,
            ...saleDoc.data(),
            createdAt: saleDoc.data().createdAt?.toDate() || new Date(),
          } as Sale;

          if (saleData.deadline) {
            saleData.deadline = saleData.deadline instanceof Date 
              ? saleData.deadline
              : new Date(saleData.deadline);
          }

          setSale(saleData);

          // Fetch store name
          if (saleData.storeId) {
            const storeDoc = await getDoc(doc(db, 'stores', saleData.storeId));
            if (storeDoc.exists()) {
              setStoreName(storeDoc.data().name);
            }
          }

          // Fetch vendor name
          if (saleData.vendorId) {
            const vendorDoc = await getDoc(doc(db, 'users', saleData.vendorId));
            if (vendorDoc.exists()) {
              setVendorName(vendorDoc.data().displayName || 'N/A');
            }
          }
        } else {
          toast.error('Vente non trouvée');
          navigate('/owner/sales');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des détails de la vente:', err);
        toast.error('Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id, navigate]);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <OwnerHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-100">
        <OwnerHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Vente non trouvée</h2>
            <p className="text-gray-500 mb-6">La vente que vous recherchez n'existe pas ou a été supprimée.</p>
            <Button onClick={() => navigate('/owner/sales')}>
              Retour à la liste des ventes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            className="mr-3"
            onClick={() => navigate('/owner/sales')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Détails de la vente</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Sale Info */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                      Vente #{sale.id.substring(0, 6)}
                    </CardTitle>
                    <CardDescription>
                      {new Date(sale.createdAt).toLocaleDateString()} - {getSaleTypeLabel(sale.saleType)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(sale.status)}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Boutique</p>
                    <div className="flex items-center">
                      <StoreIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <p>{storeName || sale.storeId.substring(0, 6)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Vendeur</p>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      <p>{vendorName || sale.vendorId.substring(0, 6)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Client</p>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      <p>{sale.customer?.name || 'Client anonyme'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-base font-medium mb-2">Articles</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toFixed(2)} €</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.totalPrice.toFixed(2)} €</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {sale.status === 'cancelled' && sale.cancellationReason && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <div>
                        <p className="font-medium text-red-800">Vente annulée</p>
                        <p className="text-sm text-red-700">Raison: {sale.cancellationReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info - if available */}
            {sale.customer && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Informations Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nom</p>
                      <p className="font-medium">{sale.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                      <p className="font-medium">{sale.customer.phone}</p>
                    </div>
                    {sale.customer.email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium">{sale.customer.email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Statut</p>
                      <p className="font-medium">
                        {sale.customer.isBadged ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Client privilégié</Badge>
                        ) : (
                          <span>Client standard</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                Résumé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Sous-total</span>
                <span>{sale.totalAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1 border-t border-dashed">
                <span className="font-medium">Total</span>
                <span className="font-bold">{sale.totalAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1 border-t">
                <span className="text-gray-600">Montant payé</span>
                <span className="text-green-600">{sale.paidAmount.toFixed(2)} €</span>
              </div>
              {sale.paidAmount < sale.totalAmount && (
                <div className="flex justify-between py-1">
                  <span className="font-medium text-red-600">Reste à payer</span>
                  <span className="font-medium text-red-600">
                    {(sale.totalAmount - sale.paidAmount).toFixed(2)} €
                  </span>
                </div>
              )}

              {sale.deadline && (
                <div className="py-1 border-t">
                  <span className="text-gray-600">Date limite de paiement</span>
                  <p className="font-medium">{sale.deadline.toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col gap-2">
              <Button className="w-full" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Générer facture
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OwnerSaleDetail;
