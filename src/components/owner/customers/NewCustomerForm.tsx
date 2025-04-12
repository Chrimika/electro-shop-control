
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';

const NewCustomerForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    isBadged: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCustomer(prev => ({ ...prev, isBadged: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!customer.name.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }

    if (!customer.phone.trim()) {
      toast.error('Le téléphone est requis');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await addDoc(collection(db, 'customers'), {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isBadged: customer.isBadged,
        createdAt: serverTimestamp()
      });
      
      toast.success('Client ajouté avec succès');
      navigate('/customers');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      toast.error('Erreur lors de l\'ajout du client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du client*</Label>
            <Input
              id="name"
              name="name"
              value={customer.name}
              onChange={handleChange}
              placeholder="Nom complet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone*</Label>
            <Input
              id="phone"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              placeholder="Numéro de téléphone"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={customer.email}
              onChange={handleChange}
              placeholder="Email (optionnel)"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isBadged" 
              checked={customer.isBadged} 
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="isBadged">Client privilégié</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/customers')}
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
                Ajout...
              </>
            ) : 'Ajouter le client'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default NewCustomerForm;
