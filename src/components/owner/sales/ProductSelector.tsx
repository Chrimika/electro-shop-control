
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, Plus, Search } from 'lucide-react';
import { Product } from '@/types';

interface ProductSelectorProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: Product[];
  selectedStore: string;
  storeInventory: {[productId: string]: number};
  onAddToCart: (product: Product) => void;
}

const ProductSelector = ({
  products,
  searchQuery,
  setSearchQuery,
  filteredProducts,
  selectedStore,
  storeInventory,
  onAddToCart
}: ProductSelectorProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Produits
        </CardTitle>
        <CardDescription>
          Recherchez et ajoutez des produits à la vente
        </CardDescription>
        
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            className="pl-8" 
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {!selectedStore ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Veuillez d'abord sélectionner une boutique</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-6">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const inStock = storeInventory[product.id] || 0;
              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{product.sellingPrice} FCFA</div>
                        <div className="text-xs">
                          {inStock > 0 ? (
                            <span className="text-green-600">En stock: {inStock}</span>
                          ) : (
                            <span className="text-red-600">Rupture de stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => onAddToCart(product)}
                        disabled={inStock <= 0}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Ajouter
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductSelector;
