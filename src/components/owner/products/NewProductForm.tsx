
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';

const NewProductForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    basePrice: '',
  });

  // Catégories prédéfinies
  const categories = [
    'Téléphones', 
    'Accessoires', 
    'Ordinateurs', 
    'Périphériques', 
    'Pièces détachées', 
    'Autre'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!product.name.trim()) {
      toast.error('Le nom du produit est requis');
      return;
    }

    if (!product.category) {
      toast.error('La catégorie est requise');
      return;
    }

    if (!product.basePrice || isNaN(Number(product.basePrice)) || Number(product.basePrice) <= 0) {
      toast.error('Veuillez entrer un prix valide');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await addDoc(collection(db, 'products'), {
        name: product.name,
        description: product.description,
        category: product.category,
        supplier: product.supplier,
        basePrice: Number(product.basePrice),
        createdAt: serverTimestamp()
      });
      
      toast.success('Produit créé avec succès');
      navigate('/products');
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du produit*</Label>
            <Input
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
              placeholder="Nom du produit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleChange}
              placeholder="Description du produit"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie*</Label>
            <Select 
              value={product.category} 
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fournisseur</Label>
            <Input
              id="supplier"
              name="supplier"
              value={product.supplier}
              onChange={handleChange}
              placeholder="Nom du fournisseur"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Prix de base*</Label>
            <div className="relative">
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={product.basePrice}
                onChange={handleChange}
                placeholder="0.00"
                className="pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/products')}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Création...
              </>
            ) : 'Créer le produit'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default NewProductForm;
