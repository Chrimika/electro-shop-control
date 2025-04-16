
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { QrCode, Search, Loader2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { db, doc, getDoc } from '@/lib/firebase';
import { Sale } from '@/types';
import { toast } from 'sonner';

interface ReceiptScannerProps {
  onSaleFound?: (sale: Sale) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onSaleFound }) => {
  const [saleId, setSaleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  
  const handleSearch = async () => {
    if (!saleId.trim()) {
      toast.error("Veuillez entrer un identifiant de vente");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Chercher d'abord par ID exact
      let saleDoc = await getDoc(doc(db, 'sales', saleId));
      
      // Si non trouvé, essayer avec le préfixe (les 6 premiers caractères)
      if (!saleDoc.exists()) {
        // Dans une implémentation réelle, vous pourriez utiliser une requête
        // pour rechercher un document où id commence par le préfixe
        toast.error("Vente non trouvée");
        setError("Aucune vente trouvée avec cet identifiant");
        setLoading(false);
        return;
      }
      
      const saleData = {
        id: saleDoc.id,
        ...saleDoc.data(),
        createdAt: saleDoc.data().createdAt?.toDate() || new Date()
      } as Sale;
      
      // Notifier le composant parent
      if (onSaleFound) {
        onSaleFound(saleData);
      }
      
      toast.success("Vente trouvée avec succès");
      setSaleId(''); // Réinitialiser le champ
      
    } catch (error) {
      console.error("Error fetching sale:", error);
      setError("Une erreur s'est produite lors de la recherche de la vente");
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };
  
  const handleScanQRCode = () => {
    // Dans une implémentation réelle, nous activerions la caméra ici
    // et utiliserions une bibliothèque comme react-qr-reader
    toast.info("La numérisation de QR code sera bientôt disponible");
    setScanMode('manual');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          Scanner un reçu
        </CardTitle>
        <CardDescription>
          Scannez un reçu pour vérifier son authenticité et afficher les détails de la vente.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={scanMode === 'manual' ? 'default' : 'outline'} 
              onClick={() => setScanMode('manual')}
              size="sm"
            >
              <Search className="h-4 w-4 mr-1" />
              Recherche manuelle
            </Button>
            
            <Button 
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              onClick={() => setScanMode('camera')}
              size="sm"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Scanner QR code
            </Button>
          </div>
          
          <Separator />
          
          {scanMode === 'manual' ? (
            <div className="space-y-2">
              <Label htmlFor="sale-id">ID de la vente ou code du reçu</Label>
              <div className="flex gap-2">
                <Input 
                  id="sale-id" 
                  value={saleId} 
                  onChange={(e) => setSaleId(e.target.value)}
                  placeholder="Entrez l'ID de la vente ou scannez le code QR"
                  disabled={loading}
                />
                <Button onClick={handleSearch} disabled={loading || !saleId.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              
              {error && (
                <div className="text-red-500 flex items-center text-sm mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-md">
              <QrCode className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-500 mb-3">Positionnez le code QR devant la caméra</p>
              <Button onClick={handleScanQRCode} className="flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                Activer la caméra
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-gray-500 border-t pt-4">
        <div className="flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" />
          Vérification de reçu
        </div>
        <p>Veuillez vous assurer que le reçu est lisible</p>
      </CardFooter>
    </Card>
  );
};

export default ReceiptScanner;
