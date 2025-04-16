
import React, { useMemo } from 'react';
import { Sale } from '@/types/';
import { CompanyInfo } from '@/types/company';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QrCode } from 'lucide-react';

interface SaleReceiptProps {
  sale: Sale;
  vendorName?: string;
  storeName?: string;
  logo?: string;
  companyInfo?: CompanyInfo;
}

const SaleReceipt: React.FC<SaleReceiptProps> = ({ sale, vendorName, storeName, logo, companyInfo }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2) + ' €';
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
  
  // Générer les données du QR Code (sale ID + timestamp pour authentification)
  const qrData = useMemo(() => {
    const verificationData = {
      id: sale.id,
      time: sale.createdAt.getTime(),
      total: sale.totalAmount
    };
    return JSON.stringify(verificationData);
  }, [sale]);
  
  // Application du style personnalisé si les infos de l'entreprise sont disponibles
  const companyColor = companyInfo?.primaryColor || '#3b82f6';

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white" id="printable-receipt">
      {/* Receipt Header with Company Info */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {companyInfo?.logo ? (
            <img src={companyInfo.logo} alt={companyInfo.name} className="h-16 mb-2" />
          ) : logo ? (
            <img src={logo} alt="Logo" className="h-16 mb-2" />
          ) : (
            <h1 className="text-2xl font-bold" style={{ color: companyColor }}>
              {companyInfo?.name || 'ElectroShop'}
            </h1>
          )}
          <p className="font-medium">{companyInfo?.name || storeName || 'Magasin ElectroShop'}</p>
          
          {companyInfo && (
            <div className="mt-2 text-sm text-gray-600">
              <p>{companyInfo.activityDomain}</p>
              <p>{companyInfo.address}</p>
              <p>Tél: {companyInfo.phone} {companyInfo.email && `• Email: ${companyInfo.email}`}</p>
              {companyInfo.website && <p>Site: {companyInfo.website}</p>}
              <p>N° Contrib.: {companyInfo.taxNumber} • RCS: {companyInfo.commercialRegisterNumber}</p>
            </div>
          )}
          
          <p className="text-gray-600 mt-2">Reçu de vente</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <h2 className="text-xl font-bold" style={{ color: companyColor }}>
            REÇU #{sale.id.substring(0, 6)}
          </h2>
          <p className="text-gray-600">Date: {formatDate(sale.createdAt)}</p>
          <p className="text-gray-600">Vendeur: {vendorName || 'N/A'}</p>
          
          {/* QR Code pour validation */}
          <div className="mt-2 border border-gray-200 rounded-md p-2">
            <QrCode size={64} />
            {/* Note: Dans une implémentation réelle, utilisez une bibliothèque de QR code comme qrcode.react */}
            <p className="text-xs text-center mt-1">Scan pour vérifier</p>
          </div>
        </div>
      </div>
      
      {/* Customer Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Client</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Nom:</p>
            <p>{sale.customer?.name || 'Client anonyme'}</p>
          </div>
          {sale.customer?.phone && (
            <div>
              <p className="text-gray-600">Téléphone:</p>
              <p>{sale.customer.phone}</p>
            </div>
          )}
          {sale.customer?.email && (
            <div>
              <p className="text-gray-600">Email:</p>
              <p>{sale.customer.email}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sale Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Détails de la vente</h3>
        <div className="mb-4">
          <p className="text-gray-600">Type: {getSaleTypeLabel(sale.saleType)}</p>
          <p className="text-gray-600">Statut: {
            sale.status === 'completed' ? 'Complétée' :
            sale.status === 'pending' ? 'En attente' :
            sale.status === 'cancelled' ? 'Annulée' : sale.status
          }</p>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: `${companyColor}20` }}>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Payment Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Résumé du paiement</h3>
        <div className="flex justify-between py-2 border-b">
          <span className="font-medium">Total:</span>
          <span className="font-bold">{formatCurrency(sale.totalAmount)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-medium">Montant payé:</span>
          <span className="text-green-600 font-medium">{formatCurrency(sale.paidAmount)}</span>
        </div>
        {sale.paidAmount < sale.totalAmount && (
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Reste à payer:</span>
            <span className="text-red-600 font-medium">{formatCurrency(sale.totalAmount - sale.paidAmount)}</span>
          </div>
        )}
        {sale.deadline && (
          <div className="flex justify-between py-2">
            <span className="font-medium">Date limite de paiement:</span>
            <span>{formatDate(sale.deadline)}</span>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8 pt-8 border-t">
        <p>Merci pour votre achat!</p>
        <p className="mt-1">Pour toute question concernant votre achat, veuillez contacter le service client.</p>
        <p className="mt-4">
          {companyInfo?.name || 'ElectroShop'} - Tous droits réservés © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default SaleReceipt;
