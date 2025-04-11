
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Tool, 
  Smartphone, 
  Laptop, 
  Clock, 
  Calendar, 
  User, 
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, collection, onSnapshot, query, where, orderBy } from '../../lib/firebase';
import { RepairRequest } from '../../types';

interface OwnerRepairsProps {
  pendingCount: number;
}

const OwnerRepairs: React.FC<OwnerRepairsProps> = ({ pendingCount }) => {
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    setLoading(true);
    
    const repairsQuery = query(
      collection(db, 'repairs'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(repairsQuery, (snapshot) => {
      const repairsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RepairRequest));
      
      setRepairs(repairsData);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const filteredRepairs = repairs.filter(repair => 
    repair.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase()) || 
    repair.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repair.issueDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'diagnosed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Diagnostiqué</Badge>;
      case 'repairing':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">En réparation</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getDeviceIcon = (type: string) => {
    switch(type) {
      case 'phone':
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case 'computer':
        return <Laptop className="h-4 w-4 text-green-500" />;
      default:
        return <Tool className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Réparations</h2>
          <p className="text-gray-500">Gérez les demandes de réparation</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <Clock className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <h3 className="text-2xl font-bold">{pendingCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Tool className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">En réparation</p>
              <h3 className="text-2xl font-bold">18</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <Smartphone className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Téléphones</p>
              <h3 className="text-2xl font-bold">42</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Laptop className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ordinateurs</p>
              <h3 className="text-2xl font-bold">15</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="inProgress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 flex gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher une réparation..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtres
          </Button>
        </div>
        
        <TabsContent value="all" className="p-0 border-none mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Problème</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Réparateur</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
                          <p className="text-gray-500">Chargement des réparations...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRepairs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Tool className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">Aucune réparation trouvée</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRepairs.map(repair => (
                      <TableRow key={repair.id}>
                        <TableCell className="font-medium">{repair.id.substring(0, 6)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getDeviceIcon(repair.deviceType)}
                            <span>{repair.deviceBrand} {repair.deviceModel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {repair.issueDescription}
                        </TableCell>
                        <TableCell>{repair.storeId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-gray-500" />
                            {repair.customerId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {repair.createdAt.toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{repair.repairerId || '—'}</TableCell>
                        <TableCell>{getStatusBadge(repair.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Autres onglets similaires avec filtres appropriés */}
        <TabsContent value="pending">
          {/* Réparations en attente */}
        </TabsContent>
        <TabsContent value="inProgress">
          {/* Réparations en cours */}
        </TabsContent>
        <TabsContent value="completed">
          {/* Réparations terminées */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerRepairs;
