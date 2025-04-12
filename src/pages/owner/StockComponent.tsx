
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowRight, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type LowStockItem = {
  id: string;
  name: string;
  storeName: string;
  quantity: number;
};

interface StockComponentProps {
  lowStockItems?: LowStockItem[];
  loading?: boolean;
}

const StockComponent: React.FC<StockComponentProps> = ({ 
  lowStockItems = [], 
  loading = false 
}) => {
  const navigate = useNavigate();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestion des stocks</h2>
          <p className="text-gray-500">Aperçu de l'état des stocks dans vos boutiques</p>
        </div>
        <Button onClick={() => navigate('/stock')} className="flex items-center">
          Voir tous les stocks <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Produits avec stock bas
          </CardTitle>
          <CardDescription>
            {lowStockItems.length > 0 
              ? `${lowStockItems.length} produits nécessitent votre attention` 
              : 'Aucun produit avec un stock bas pour le moment'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Tous vos stocks sont à des niveaux normaux</p>
              <Button variant="outline" onClick={() => navigate('/products')} className="mt-4">
                Gérer les produits
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={`${item.id}-${item.storeName}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.storeName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        item.quantity <= 0 
                          ? 'bg-red-100 text-red-800 border-red-200' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }>
                        {item.quantity <= 0 ? 'Épuisé' : 'Bas'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockComponent;
