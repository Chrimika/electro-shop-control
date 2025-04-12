
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Mail, Phone, Plus, Search, User } from 'lucide-react';
import { Customer } from '@/types';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';
import { toast } from 'sonner';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  filteredCustomers: Customer[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
}

const CustomerSelector = ({
  selectedCustomer,
  setSelectedCustomer,
  filteredCustomers,
  customerSearchQuery,
  setCustomerSearchQuery
}: CustomerSelectorProps) => {
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    isBadged: false
  });

  const handleAddCustomer = async () => {
    // Form validation
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Le nom et le téléphone du client sont obligatoires');
      return;
    }
    
    try {
      const customerData = {
        ...newCustomer,
        createdAt: serverTimestamp()
      };
      
      const customerRef = await addDoc(collection(db, 'customers'), customerData);
      const newCustomerWithId: Customer = {
        id: customerRef.id,
        ...newCustomer
      };
      
      setSelectedCustomer(newCustomerWithId);
      
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        isBadged: false
      });
      
      toast.success('Client ajouté avec succès');
      return newCustomerWithId;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du client:', err);
      toast.error('Erreur lors de l\'ajout du client');
      return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Client
        </CardTitle>
        <CardDescription>
          {selectedCustomer ? 'Client sélectionné' : 'Sélectionner ou ajouter un client'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedCustomer ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">{selectedCustomer.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Phone className="h-3.5 w-3.5 mr-1" />
                  {selectedCustomer.phone}
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center text-sm text-gray-500 mt-0.5">
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    {selectedCustomer.email}
                  </div>
                )}
              </div>
              {selectedCustomer.isBadged && (
                <Badge>Client privilégié</Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3"
              onClick={() => setSelectedCustomer(null)}
            >
              Changer de client
            </Button>
          </div>
        ) : (
          <div className="flex justify-between">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Sélectionner un client
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Sélectionner un client</SheetTitle>
                  <SheetDescription>
                    Recherchez un client existant ou créez-en un nouveau
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-4 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="pl-8" 
                    placeholder="Rechercher par nom, téléphone ou email..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-6">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Aucun client trouvé</p>
                    </div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          document.querySelector<HTMLButtonElement>('.sheet-close')?.click();
                        }}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{customer.name}</h3>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                            {customer.email && (
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            )}
                          </div>
                          {customer.isBadged && (
                            <Badge>Client privilégié</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <SheetFooter className="mt-6">
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full">Annuler</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau client</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un nouveau client
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du client*</Label>
                    <Input
                      id="name"
                      placeholder="Nom du client"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone*</Label>
                    <Input
                      id="phone"
                      placeholder="Numéro de téléphone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email (optionnel)"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isBadged"
                      checked={newCustomer.isBadged}
                      onChange={(e) => setNewCustomer({...newCustomer, isBadged: e.target.checked})}
                    />
                    <Label htmlFor="isBadged">Client privilégié</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      document.querySelector<HTMLButtonElement>('.dialog-close')?.click();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={async () => {
                      const customer = await handleAddCustomer();
                      if (customer) {
                        document.querySelector<HTMLButtonElement>('.dialog-close')?.click();
                      }
                    }}
                  >
                    Ajouter le client
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerSelector;
