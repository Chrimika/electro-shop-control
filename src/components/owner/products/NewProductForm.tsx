
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL, query, where, getDocs } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ImagePlus } from 'lucide-react';

interface ProductFormValues {
  name: string;
  category: string;
  description: string;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
}

const NewProductForm = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userStores, setUserStores] = useState<Array<{id: string, name: string}>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      category: '',
      description: '',
      supplier: '',
      purchasePrice: 0,
      sellingPrice: 0
    }
  });
  
  // Charger les magasins de l'utilisateur
  useEffect(() => {
    const fetchUserStores = async () => {
      if (!currentUser) return;
      
      try {
        const storesQuery = query(
          collection(db, 'stores'),
          where('ownerId', '==', currentUser.id)
        );
        
        const storesSnapshot = await getDocs(storesQuery);
        const stores = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setUserStores(stores);
        
        // Sélectionner automatiquement le premier magasin si disponible
        if (stores.length > 0) {
          setSelectedStoreId(stores[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des magasins:', error);
      }
    };
    
    fetchUserStores();
  }, [currentUser]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  const onSubmit = async (data: ProductFormValues) => {
    if (!currentUser) {
      toast.error('Vous devez être connecté pour créer un produit');
      return;
    }
    
    if (!selectedStoreId) {
      toast.error('Veuillez sélectionner un magasin');
      return;
    }
    
    try {
      setLoading(true);
      
      let imageUrl = '';
      
      // Upload de l'image si présente
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      const productData = {
        name: data.name,
        category: data.category,
        description: data.description,
        supplier: data.supplier,
        purchasePrice: Number(data.purchasePrice),
        sellingPrice: Number(data.sellingPrice),
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        ownerId: currentUser.id,
        storeId: selectedStoreId
      };
      
      await addDoc(collection(db, 'products'), productData);
      toast.success('Produit créé avec succès');
      navigate('/owner/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit*</Label>
              <Input
                id="name"
                {...register('name', { required: 'Le nom est requis' })}
                placeholder="Nom du produit"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie*</Label>
              <Input
                id="category"
                {...register('category', { required: 'La catégorie est requise' })}
                placeholder="Catégorie du produit"
                className={errors.category ? 'border-red-500' : ''}
              />
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="store">Magasin*</Label>
            <select
              id="store"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
            >
              <option value="">Sélectionner un magasin</option>
              {userStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            {userStores.length === 0 && (
              <p className="text-yellow-500 text-sm">
                Aucun magasin disponible. Veuillez d'abord créer un magasin.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description du produit"
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur*</Label>
              <Input
                id="supplier"
                {...register('supplier', { required: 'Le fournisseur est requis' })}
                placeholder="Nom du fournisseur"
                className={errors.supplier ? 'border-red-500' : ''}
              />
              {errors.supplier && <p className="text-red-500 text-sm">{errors.supplier.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Prix d'achat (FCFA)*</Label>
              <Input
                id="purchasePrice"
                type="number"
                {...register('purchasePrice', { 
                  required: 'Le prix d\'achat est requis',
                  min: { value: 0, message: 'Le prix ne peut pas être négatif' }
                })}
                placeholder="0"
                className={errors.purchasePrice ? 'border-red-500' : ''}
              />
              {errors.purchasePrice && <p className="text-red-500 text-sm">{errors.purchasePrice.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Prix de vente (FCFA)*</Label>
              <Input
                id="sellingPrice"
                type="number"
                {...register('sellingPrice', { 
                  required: 'Le prix de vente est requis',
                  min: { value: 0, message: 'Le prix ne peut pas être négatif' }
                })}
                placeholder="0"
                className={errors.sellingPrice ? 'border-red-500' : ''}
              />
              {errors.sellingPrice && <p className="text-red-500 text-sm">{errors.sellingPrice.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Image du produit (optionnelle)</Label>
              <div className="mt-1 flex items-center">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Aperçu de l'image" 
                      className="w-32 h-32 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveImage}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 transition-colors">
                      <ImagePlus className="h-8 w-8 mb-1" />
                      <span className="text-xs">Ajouter une image</span>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/owner/products')}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || userStores.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le produit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewProductForm;
