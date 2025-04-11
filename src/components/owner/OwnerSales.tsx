
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, FileBarChart, ShoppingBag } from 'lucide-react';
import { Sale } from '../../types';

interface OwnerSalesProps {
  recentSales: Sale[];
}

const getSaleTypeLabel = (type: string) => {
  switch (type) {
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

const OwnerSales: React.FC<OwnerSalesProps> = ({ recentSales }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ventes</h2>
          <p className="text-gray-500">Aperçu des ventes récentes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" /> Rapport
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventes totales</CardDescription>
            <CardTitle className="text-3xl">257</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-500 flex items-center">
              +12% depuis le mois dernier
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chiffre d'affaires</CardDescription>
            <CardTitle className="text-3xl">24 750 €</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-500 flex items-center">
              +8% depuis le mois dernier
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventes en tranches</CardDescription>
            <CardTitle className="text-3xl">18</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-500 flex items-center">
              5 échéances proches
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Panier moyen</CardDescription>
            <CardTitle className="text-3xl">96 €</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-500 flex items-center">
              -3% depuis le mois dernier
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Ventes récentes
          </CardTitle>
          <CardDescription>Liste des dernières ventes enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune vente récente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id.substring(0, 6)}</TableCell>
                    <TableCell>{sale.storeId}</TableCell>
                    <TableCell>{getSaleTypeLabel(sale.saleType)}</TableCell>
                    <TableCell>{sale.customer?.name || 'Client anonyme'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CreditCard className="h-3 w-3" />
                        {sale.totalAmount} €
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{sale.paidAmount} €</TableCell>
                    <TableCell>
                      <div className={`
                        px-2 py-1 rounded-full text-xs flex items-center justify-center w-24
                        ${sale.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${sale.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {sale.status === 'completed' && 'Complétée'}
                        {sale.status === 'pending' && 'En attente'}
                        {sale.status === 'cancelled' && 'Annulée'}
                      </div>
                    </TableCell>
                    <TableCell>{sale.createdAt.toLocaleDateString()}</TableCell>
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

export default OwnerSales;
