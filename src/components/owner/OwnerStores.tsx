
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Edit, Trash2, Plus, Users, ShoppingBag, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Store as StoreType } from '../../types';

interface OwnerStoresProps {
  stores: StoreType[];
}

const OwnerStores: React.FC<OwnerStoresProps> = ({ stores }) => {
  const handleAddStore = () => {
    toast.info("Fonctionnalité d'ajout de boutique à implémenter");
  };

  const handleEditStore = (storeId: string) => {
    toast.info(`Modifier la boutique avec l'ID: ${storeId}`);
  };

  const handleDeleteStore = (storeId: string) => {
    toast.info(`Supprimer la boutique avec l'ID: ${storeId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Boutiques</h2>
          <p className="text-gray-500">Gérez toutes vos boutiques</p>
        </div>
        <Button onClick={handleAddStore} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Ajouter une boutique
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card className="text-center p-6">
          <CardContent className="pt-6 pb-4">
            <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune boutique</h3>
            <p className="text-gray-500 mb-4">Vous n'avez pas encore ajouté de boutiques à votre compte.</p>
            <Button onClick={handleAddStore}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter votre première boutique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" /> {store.name}
                </CardTitle>
                <CardDescription>{store.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">12 employés</span>
                  </div>
                  <div className="flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">152 ventes ce mois</span>
                  </div>
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">24 réparations en cours</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleEditStore(store.id)}>
                  <Edit className="h-4 w-4 mr-1" /> Modifier
                </Button>
                <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDeleteStore(store.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerStores;
