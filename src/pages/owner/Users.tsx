
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, User, UserX, UserCheck, Store, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import OwnerHeader from '@/components/owner/OwnerHeader';
import { db, auth, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, createUserWithEmailAndPassword, setDoc } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserType, Store as StoreType } from '../../types';

const UsersPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm({
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      role: 'vendor',
      storeId: '',
      repairSpecialty: ''
    }
  });
  
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch users
    const usersQuery = query(collection(db, 'users'), where('role', 'in', ['vendor', 'repairer']));
    
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserType));
      setUsers(usersData);
      setLoading(false);
    });
    
    // Fetch stores
    const storesUnsubscribe = onSnapshot(collection(db, 'stores'), (snapshot) => {
      const storesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoreType));
      setStores(storesData);
    });
    
    return () => {
      unsubscribeUsers();
      storesUnsubscribe();
    };
  }, [currentUser]);
  
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUser) {
        // Update existing user
        await updateDoc(doc(db, 'users', editingUser.id), {
          displayName: data.displayName,
          role: data.role,
          storeId: data.storeId,
          repairSpecialty: data.role === 'repairer' ? data.repairSpecialty : null,
        });
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        // Create new user with Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          storeId: data.storeId,
          repairSpecialty: data.role === 'repairer' ? data.repairSpecialty : null,
          createdAt: new Date()
        });
        
        toast.success('Utilisateur créé avec succès');
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };
  
  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    form.reset({
      email: user.email,
      displayName: user.displayName,
      password: '',
      role: user.role,
      storeId: user.storeId || '',
      repairSpecialty: user.repairSpecialty || ''
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        toast.success('Utilisateur supprimé avec succès');
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Une erreur est survenue lors de la suppression');
      }
    }
  };
  
  const resetForm = () => {
    form.reset({
      email: '',
      displayName: '',
      password: '',
      role: 'vendor',
      storeId: '',
      repairSpecialty: ''
    });
    setEditingUser(null);
    setIsDialogOpen(false);
  };
  
  const currentRole = form.watch('role');

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Utilisateurs</h1>
            <p className="text-gray-500">Gérez les vendeurs et réparateurs</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour {editingUser ? 'modifier' : 'créer'} un utilisateur
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...form.register('email', { required: true })}
                    placeholder="Email"
                    disabled={!!editingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nom complet</Label>
                  <Input 
                    id="displayName" 
                    {...form.register('displayName', { required: true })}
                    placeholder="Nom complet"
                  />
                </div>
                
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input 
                      id="password" 
                      type="password"
                      {...form.register('password', { required: !editingUser })}
                      placeholder="Mot de passe"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('role', value as 'vendor' | 'repairer')} 
                    defaultValue={form.getValues('role')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendeur</SelectItem>
                      <SelectItem value="repairer">Réparateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeId">Boutique</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('storeId', value)} 
                    defaultValue={form.getValues('storeId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une boutique" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentRole === 'repairer' && (
                  <div className="space-y-2">
                    <Label htmlFor="repairSpecialty">Spécialité</Label>
                    <Select 
                      onValueChange={(value) => form.setValue('repairSpecialty', value)} 
                      defaultValue={form.getValues('repairSpecialty')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Téléphones</SelectItem>
                        <SelectItem value="computer">Ordinateurs</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <Card className="text-center p-6">
            <CardContent className="pt-6 pb-4">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun utilisateur</h3>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore ajouté d'utilisateurs.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter votre premier utilisateur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>Tous les vendeurs et réparateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userStore = stores.find(store => store.id === user.storeId);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.displayName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.role === 'vendor' ? (
                              <>
                                <Store className="h-4 w-4 text-blue-500" />
                                <span>Vendeur</span>
                              </>
                            ) : (
                              <>
                                <Wrench className="h-4 w-4 text-green-500" />
                                <span>Réparateur</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{userStore?.name || '-'}</TableCell>
                        <TableCell>{user.repairSpecialty || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditUser(user)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UsersPage;
