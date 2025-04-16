
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db, doc, getDoc } from '@/lib/firebase';
import { Sale } from '@/types';
import { toast } from 'sonner';
import VendorHeader from '@/components/vendor/VendorHeader';
import ReceiptExporter from '@/components/vendor/ReceiptExporter';
import SaleReceipt from '@/components/vendor/SaleReceipt';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

const VendorSaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { companyInfo } = useCompanyInfo();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!id || !currentUser) return;

      try {
        setLoading(true);
        
        // Get sale data
        const saleDoc = await getDoc(doc(db, 'sales', id));
        
        if (!saleDoc.exists()) {
          toast.error("Vente non trouvée");
          navigate('/vendor/sales');
          return;
        }
        
        const saleData = {
          id: saleDoc.id,
          ...saleDoc.data(),
          createdAt: saleDoc.data().createdAt?.toDate() || new Date(),
        } as Sale;

        // Ensure the sale belongs to the vendor's store
        if (saleData.storeId !== currentUser.storeId) {
          toast.error("Vous n'avez pas accès à cette vente");
          navigate('/vendor/sales');
          return;
        }

        setSale(saleData);
        
        // Get store data
        const storeDoc = await getDoc(doc(db, 'stores', saleData.storeId));
        if (storeDoc.exists()) {
          setStoreName(storeDoc.data().name);
        }
        
        // Get vendor data
        if (saleData.vendorId) {
          const vendorDoc = await getDoc(doc(db, 'users', saleData.vendorId));
          if (vendorDoc.exists()) {
            setVendorName(vendorDoc.data().displayName || saleData.vendorId.substring(0, 6));
          }
        }
      } catch (error) {
        console.error("Error fetching sale details:", error);
        toast.error("Erreur lors du chargement des détails de la vente");
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id, navigate, currentUser]);

  // Add print-specific styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-receipt, #printable-receipt * {
          visibility: visible;
        }
        #printable-receipt {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VendorHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Vente non trouvée</h2>
            <p className="text-gray-500 mb-6">La vente que vous recherchez n'existe pas ou a été supprimée.</p>
            <Button onClick={() => navigate('/vendor/sales')}>
              Retour à la liste des ventes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show only the printable receipt when in print view
  if (showPrintView) {
    return (
      <SaleReceipt 
        sale={sale} 
        vendorName={vendorName} 
        storeName={storeName} 
        companyInfo={companyInfo || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-3" 
              onClick={() => navigate('/vendor/sales')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <h1 className="text-3xl font-bold">Détail de la vente #{sale.id.substring(0, 6)}</h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SaleReceipt 
              sale={sale} 
              vendorName={vendorName} 
              storeName={storeName} 
              companyInfo={companyInfo || undefined}
            />
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Options pour cette vente</CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiptExporter sale={sale} vendorName={vendorName} storeName={storeName} />
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowPrintView(true)}
                >
                  Aperçu avant impression
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorSaleDetail;
