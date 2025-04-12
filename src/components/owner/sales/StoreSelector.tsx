
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StoreIcon } from 'lucide-react';

interface StoreSelectorProps {
  selectedStore: string;
  setSelectedStore: (storeId: string) => void;
  stores: { id: string; name: string }[];
}

const StoreSelector = ({
  selectedStore,
  setSelectedStore,
  stores
}: StoreSelectorProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <StoreIcon className="h-5 w-5 mr-2 text-blue-600" />
          Sélection de la boutique
        </CardTitle>
        <CardDescription>
          Sélectionnez la boutique pour cette vente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une boutique" />
          </SelectTrigger>
          <SelectContent>
            {stores.map(store => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default StoreSelector;
