
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, User, Search, Plus, Filter, UserPlus } from 'lucide-react';
import { db, collection, onSnapshot } from '../lib/firebase';
import { Customer } from '../types';

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Customer));
      setCustomers(customersData);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-500">Gérez vos clients</p>
          </div>
          <Button 
            onClick={() => navigate('/customers/new')}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des clients</CardTitle>
            <CardDescription>
              {customers.length} clients enregistrés
            </CardDescription>
            
            <div className="mt-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un client..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement des clients...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun client trouvé</p>
                <Button 
                  onClick={() => navigate('/customers/new')} 
                  variant="outline" 
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {customer.phone}
                          </span>
                          {customer.email && (
                            <span className="flex items-center mt-1">
                              <Mail className="h-3.5 w-3.5 mr-1 text-gray-500" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.isBadged ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Client privilégié
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Éditer</Button>
                        <Button variant="ghost" size="sm" className="text-blue-600">Historique</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomersPage;
