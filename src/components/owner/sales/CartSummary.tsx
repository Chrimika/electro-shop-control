
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { SaleItem } from '@/types';

interface CartSummaryProps {
  cart: SaleItem[];
  updateItemQuantity: (productId: string, quantity: number) => void;
  handleRemoveFromCart: (productId: string) => void;
}

const CartSummary = ({
  cart,
  updateItemQuantity,
  handleRemoveFromCart
}: CartSummaryProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
          Panier
        </CardTitle>
        <CardDescription>
          {cart.length === 0 ? 'Le panier est vide' : `${cart.length} produit(s) dans le panier`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Ajoutez des produits au panier</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map(item => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{item.unitPrice} €</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="mx-2">{item.quantity}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.totalPrice} €</TableCell>
                  <TableCell>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-red-500"
                      onClick={() => handleRemoveFromCart(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CartSummary;
