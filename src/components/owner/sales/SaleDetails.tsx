
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Receipt } from 'lucide-react';
import { SaleType } from '@/types';

interface SaleDetailsProps {
  saleType: SaleType;
  setSaleType: (type: SaleType) => void;
  paidAmount: number;
  setPaidAmount: (amount: number) => void;
  total: number;
  handleSubmitSale: () => void;
  isSubmitting: boolean;
  cart: any[];
  selectedStore: string;
}

const SaleDetails = ({
  saleType,
  setSaleType,
  paidAmount,
  setPaidAmount,
  total,
  handleSubmitSale,
  isSubmitting,
  cart,
  selectedStore
}: SaleDetailsProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Receipt className="h-5 w-5 mr-2 text-blue-600" />
          Détails de la vente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="saleType">Type de vente</Label>
          <Select value={saleType} onValueChange={(value: SaleType) => setSaleType(value)}>
            <SelectTrigger id="saleType">
              <SelectValue placeholder="Sélectionner le type de vente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Vente directe (paiement complet)</SelectItem>
              <SelectItem value="installment">Vente en tranches</SelectItem>
              <SelectItem value="partialPaid">80% payé</SelectItem>
              <SelectItem value="deliveredNotPaid">Livré non payé</SelectItem>
              <SelectItem value="trade">Troc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="paidAmount">Montant payé</Label>
          <div className="relative">
            <Input
              id="paidAmount"
              type="number"
              min="0"
              step="0.01"
              max={total}
              value={saleType === 'direct' ? total : paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              disabled={saleType === 'direct'}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between py-1">
          <span className="font-medium">Total des articles</span>
          <span className="font-bold">{total.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between py-1">
          <span className="font-medium text-green-600">Montant payé</span>
          <span className="font-medium text-green-600">
            {(saleType === 'direct' ? total : paidAmount).toFixed(2)} €
          </span>
        </div>
        
        {saleType !== 'direct' && (
          <div className="flex justify-between py-1">
            <span className="font-medium text-red-600">Reste à payer</span>
            <span className="font-medium text-red-600">
              {Math.max(0, total - paidAmount).toFixed(2)} €
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          className="w-full"
          disabled={cart.length === 0 || !selectedStore || isSubmitting}
          onClick={handleSubmitSale}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              En cours...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Finaliser la vente
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SaleDetails;
