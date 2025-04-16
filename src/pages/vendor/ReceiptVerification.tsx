
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import ReceiptScanner from '@/components/shared/ReceiptScanner';
import SaleReceipt from '@/components/vendor/SaleReceipt';
import { Sale } from '@/types';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { useAuth } from '@/contexts/AuthContext';
import { db, doc, getDoc } from '@/lib/firebase';

const ReceiptVerificationPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { companyInfo } = useCompanyInfo();
  const [scannedSale, setScannedSale] = useState<Sale | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [storeName, setStoreName] = useState('');
  
  const handleSaleFound = async (sale: Sale) => {
    setScannedSale(sale);
    
    try {
      // Get vendor information
      if (sale.vendorId) {
        const vendorDoc = await getDoc(doc(db, 'users', sale.vendorId));
        if (vendorDoc.exists()) {
          setVendorName(vendorDoc.data().displayName || '');
        }
      }
      
      // Get store information
      if (sale.storeId) {
        const storeDoc = await getDoc(doc(db, 'stores', sale.storeId));
        if (storeDoc.exists()) {
          setStoreName(storeDoc.data().name || '');
        }
      }
    } catch (error) {
      console.error("Error fetching related information:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Vérification de reçu</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ReceiptScanner onSaleFound={handleSaleFound} />
          </div>
          
          <div>
            {scannedSale ? (
              <Card>
                <CardContent className="p-0">
                  <SaleReceipt 
                    sale={scannedSale} 
                    vendorName={vendorName} 
                    storeName={storeName}
                    companyInfo={companyInfo || undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full p-6 mb-4 inline-block">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-10 w-10 text-gray-400"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-medium mb-1">Aucun reçu scanné</h2>
                  <p className="text-gray-500">
                    Utilisez le scanner à gauche pour vérifier un reçu et afficher les détails de la vente.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReceiptVerificationPage;
