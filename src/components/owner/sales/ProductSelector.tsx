
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Tag, CircleDollarSign } from 'lucide-react';
import { Product } from '@/types';
import { toast } from 'sonner';

interface ProductSelectorProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: Product[];
  selectedStore: string;
  storeInventory: {[productId: string]: number};
  onAddToCart: (product: Product, quantity: number, customPrice?: number) => void;
}

const ProductSelector = ({
  searchQuery,
  setSearchQuery,
  filteredProducts,
  selectedStore,
  storeInventory,
  onAddToCart
}: ProductSelectorProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleAddToCart = () => {
    if (selectedProduct) {
      onAddToCart(selectedProduct, quantity, customPrice);
      setSelectedProduct(null);
      setQuantity(1);
      setCustomPrice(undefined);
      setIsDialogOpen(false);
      
      // Show confirmation toast with preview link
      toast.success('Produit ajouté au panier', {
        description: 'Le produit a été ajouté au panier avec succès.',
        action: {
          label: 'Voir le reçu',
          onClick: () => {
            // This will trigger the preview view to be shown
            const previewEvent = new CustomEvent('showReceiptPreview');
            window.dispatchEvent(previewEvent);
          }
        }
      });
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setCustomPrice(undefined);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Tag className="h-5 w-5 mr-2 text-blue-600" />
          Produits
        </CardTitle>
        <CardDescription>
          {selectedStore ? "Sélectionner des produits à ajouter au panier" : "Veuillez d'abord sélectionner une boutique"}
        </CardDescription>
        
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!selectedStore}
          />
        </div>
      </CardHeader>
      <CardContent>
        {!selectedStore ? (
          <div className="text-center py-8 text-gray-500">
            Veuillez sélectionner une boutique pour afficher les produits disponibles
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun produit trouvé. Essayez une autre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
            {filteredProducts.map((product) => {
              const stock = storeInventory[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className={`border rounded-md p-3 ${
                    stock > 0 
                      ? 'cursor-pointer hover:bg-gray-50' 
                      : 'opacity-60 bg-gray-100'
                  }`}
                  onClick={() => stock > 0 && handleProductSelect(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{product.sellingPrice} €</div>
                      <Badge 
                        variant={stock > 5 ? "default" : stock > 0 ? "outline" : "destructive"}
                        className="mt-1"
                      >
                        Stock: {stock}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Dialogue pour la quantité et prix personnalisé */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter au panier</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name} - {selectedProduct?.sellingPrice} €/unité
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="quantity" className="text-right">
                  Quantité
                </label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  min={1}
                  max={selectedProduct ? (storeInventory[selectedProduct.id] || 0) : 0}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right flex items-center justify-end">
                  Prix <CircleDollarSign className="ml-1 h-4 w-4 text-gray-500" />
                </label>
                <div className="col-span-3">
                  <Input
                    id="price"
                    type="number"
                    placeholder={selectedProduct ? `${selectedProduct.sellingPrice} € (prix par défaut)` : ""}
                    value={customPrice === undefined ? "" : customPrice}
                    min={0}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="col-span-3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour utiliser le prix par défaut
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddToCart}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter au panier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductSelector;
