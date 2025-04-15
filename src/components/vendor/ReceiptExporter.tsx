
import React from 'react';
import { Button } from '@/components/ui/button';
import { FilePdf, Printer, FileText, Download } from 'lucide-react';
import { Sale } from '@/types';
import { toast } from 'sonner';

interface ReceiptExporterProps {
  sale: Sale;
  vendorName?: string;
  storeName?: string;
}

const ReceiptExporter: React.FC<ReceiptExporterProps> = ({ sale, vendorName, storeName }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info("Export PDF en cours de développement");
    // Dans une implémentation réelle, nous utiliserions une bibliothèque comme jsPDF
    // pour générer un PDF côté client, ou ferions appel à une fonction Firebase
    // pour générer le PDF côté serveur.
  };

  const handleDownloadCSV = () => {
    try {
      // Formatage des données pour CSV
      const headers = ["Produit", "Prix unitaire", "Quantité", "Total"];
      
      const itemRows = sale.items.map(item => [
        item.productName,
        item.unitPrice.toString(),
        item.quantity.toString(),
        item.totalPrice.toString()
      ]);
      
      const summaryRows = [
        ["", "", "Total", sale.totalAmount.toString()],
        ["", "", "Payé", sale.paidAmount.toString()],
        ["", "", "Reste", (sale.totalAmount - sale.paidAmount).toString()]
      ];
      
      const allRows = [
        [`Reçu de vente #${sale.id.substring(0, 6)}`],
        [`Date: ${new Date(sale.createdAt).toLocaleDateString()}`],
        [`Vendeur: ${vendorName || 'N/A'}`],
        [`Boutique: ${storeName || 'N/A'}`],
        [`Client: ${sale.customer?.name || 'Client anonyme'}`],
        [""],
        headers,
        ...itemRows,
        [""],
        ...summaryRows
      ];
      
      // Conversion en format CSV
      const csvContent = allRows.map(row => row.join(",")).join("\n");
      
      // Création du fichier à télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Déclenchement du téléchargement
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `recu-vente-${sale.id.substring(0, 6)}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Reçu exporté avec succès");
    } catch (error) {
      console.error("Failed to export receipt:", error);
      toast.error("Erreur lors de l'exportation du reçu");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handlePrint} className="flex items-center justify-center">
        <Printer className="h-4 w-4 mr-2" />
        Imprimer
      </Button>
      
      <Button 
        onClick={handleDownloadPDF} 
        variant="outline"
        className="flex items-center justify-center"
      >
        <FilePdf className="h-4 w-4 mr-2" />
        Exporter en PDF
      </Button>
      
      <Button 
        onClick={handleDownloadCSV}
        variant="outline" 
        className="flex items-center justify-center"
      >
        <FileText className="h-4 w-4 mr-2" />
        Exporter en CSV
      </Button>
    </div>
  );
};

export default ReceiptExporter;
