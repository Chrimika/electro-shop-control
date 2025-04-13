
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Edit, Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import OwnerHeader from '@/components/owner/OwnerHeader';
import { db, collection, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Store as StoreType } from '@/types';

const StoresPage = () => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: ''
    }
  });
  
  useEffect(() => {
    if (!currentUser) return;
    
    // Modifié pour ne récupérer que les magasins appartenant à l'utilisateur connecté
    const storesQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', currentUser.id)
    );
    
    const unsubscribe = onSnapshot(storesQuery, (snapshot) => {
      const storesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoreType));
      setStores(storesData);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [currentUser]);
  
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingStore) {
        // Update existing store
        await updateDoc(doc(db, 'stores', editingStore.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
        toast.success('Boutique mise à jour avec succès');
      } else {
        // Create new store
        await addDoc(collection(db, 'stores'), {
          ...data,
          createdAt: serverTimestamp(),
          ownerId: currentUser?.id
        });
        toast.success('Boutique créée avec succès');
      }
      
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    }
  };
  
  const handleEditStore = (store: StoreType) => {
    setEditingStore(store);
    form.reset({
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email || ''
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteStore = async (storeId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      try {
        await deleteDoc(doc(db, 'stores', storeId));
        toast.success('Boutique supprimée avec succès');
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Une erreur est survenue lors de la suppression');
      }
    }
  };
  
  const resetForm = () => {
    form.reset({
      name: '',
      address: '',
      phone: '',
      email: ''
    });
    setEditingStore(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Boutiques</h1>
            <p className="text-gray-500">Gérez toutes vos boutiques</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Ajouter une boutique
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStore ? 'Modifier la boutique' : 'Ajouter une boutique'}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour {editingStore ? 'modifier' : 'créer'} une boutique
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la boutique</Label>
                  <Input 
                    id="name" 
                    {...form.register('name', { required: true })}
                    placeholder="Nom de la boutique"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input 
                    id="address" 
                    {...form.register('address', { required: true })}
                    placeholder="Adresse complète"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone" 
                    {...form.register('phone', { required: true })}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optionnel)</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...form.register('email')}
                    placeholder="Email de contact"
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingStore ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des boutiques...</p>
          </div>
        ) : stores.length === 0 ? (
          <Card className="text-center p-6">
            <CardContent className="pt-6 pb-4">
              <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune boutique</h3>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore ajouté de boutiques à votre compte.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter votre première boutique
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" /> {store.name}
                  </CardTitle>
                  <CardDescription>{store.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Téléphone:</span> {store.phone}
                    </p>
                    {store.email && (
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {store.email}
                      </p>
                    )}
                    <div className="flex justify-between mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditStore(store)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" /> Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteStore(store.id)}
                        className="flex items-center gap-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StoresPage;
