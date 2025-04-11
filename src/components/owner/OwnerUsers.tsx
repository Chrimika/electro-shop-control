
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, Plus, Search, UserPlus, Store, Tools, Users } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { db, collection, onSnapshot } from '../../lib/firebase';
import { User } from '../../types';

const OwnerUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    });
    
    return unsubscribe;
  }, []);
  
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'owner':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'vendor':
        return <Store className="h-4 w-4 text-blue-500" />;
      case 'repairer':
        return <Tools className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'owner':
        return 'Propriétaire';
      case 'vendor':
        return 'Vendeur';
      case 'repairer':
        return 'Réparateur';
      default:
        return role;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Utilisateurs</h2>
          <p className="text-gray-500">Gérez les utilisateurs et leurs permissions</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Ajouter un utilisateur
        </Button>
      </div>
      
      <Tabs defaultValue="allUsers" className="mb-6">
        <TabsList>
          <TabsTrigger value="allUsers">Tous</TabsTrigger>
          <TabsTrigger value="owners">Propriétaires</TabsTrigger>
          <TabsTrigger value="vendors">Vendeurs</TabsTrigger>
          <TabsTrigger value="repairers">Réparateurs</TabsTrigger>
        </TabsList>
        <div className="mt-4 flex gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher un utilisateur..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Filtres <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Date d'ajout</DropdownMenuItem>
              <DropdownMenuItem>Ordre alphabétique</DropdownMenuItem>
              <DropdownMenuItem>Rôle</DropdownMenuItem>
              <DropdownMenuItem>Boutique</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <TabsContent value="allUsers" className="p-0 border-none">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Users className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">Aucun utilisateur trouvé</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {user.displayName ? getInitials(user.displayName) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.storeId || '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <span className="sr-only">Actions</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                              <DropdownMenuItem>Modifier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="owners">
          {/* Contenu similaire mais filtré pour les propriétaires */}
          <Card>
            <CardHeader>
              <CardTitle>Propriétaires</CardTitle>
              <CardDescription>Gérez les comptes propriétaires</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="vendors">
          {/* Contenu similaire mais filtré pour les vendeurs */}
          <Card>
            <CardHeader>
              <CardTitle>Vendeurs</CardTitle>
              <CardDescription>Gérez les comptes vendeurs</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="repairers">
          {/* Contenu similaire mais filtré pour les réparateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Réparateurs</CardTitle>
              <CardDescription>Gérez les comptes réparateurs</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerUsers;
