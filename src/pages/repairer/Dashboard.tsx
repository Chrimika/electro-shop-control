import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { db, collection, query, where, getDocs } from '@/lib/firebase';
import { RepairRequest } from '@/types';
import { Calendar, Clock, Wrench } from 'lucide-react';

const RepairerDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const fetchRepairRequests = async () => {
      if (!currentUser?.id) return;

      try {
        setLoading(true);
        const repairRequestsQuery = query(
          collection(db, 'repairRequests'),
          where('repairerId', '==', currentUser.id)
        );

        const repairRequestsSnapshot = await getDocs(repairRequestsQuery);
        const repairRequestsData = repairRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RepairRequest));

        setRepairRequests(repairRequestsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching repair requests:', error);
        setLoading(false);
      }
    };

    fetchRepairRequests();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord réparateur</h1>
            <p className="text-gray-500">Bonjour, {currentUser?.displayName}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              <Wrench className="w-4 h-4 mr-2" />
              <span>Spécialité: {currentUser?.repairSpecialty || 'Non spécifié'}</span>
            </div>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="inProgress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            repairRequests
              .filter(request => request.status === 'pending' || request.status === 'diagnosed')
              .map(request => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>{request.deviceBrand} {request.deviceModel}</span>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {request.status === 'pending' ? 'En attente' : 'Diagnostiqué'}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Type: {request.deviceType === 'phone' ? 'Téléphone' : 
                            request.deviceType === 'computer' ? 'Ordinateur' : 'Autre'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{request.issueDescription}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>
                        {new Date(request.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="inProgress" className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            repairRequests
              .filter(request => request.status === 'repairing')
              .map(request => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>{request.deviceBrand} {request.deviceModel}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        En réparation
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Type: {request.deviceType === 'phone' ? 'Téléphone' : 
                            request.deviceType === 'computer' ? 'Ordinateur' : 'Autre'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{request.issueDescription}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        <span>
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {request.estimatedDuration && (
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Durée estimée: {request.estimatedDuration}h
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            repairRequests
              .filter(request => request.status === 'completed')
              .map(request => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>{request.deviceBrand} {request.deviceModel}</span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Terminé
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Type: {request.deviceType === 'phone' ? 'Téléphone' : 
                            request.deviceType === 'computer' ? 'Ordinateur' : 'Autre'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{request.issueDescription}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        <span>Terminé le: </span>
                        <span>
                          {request.completedAt ? new Date(request.completedAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      {request.estimatedCost && (
                        <div className="text-xs font-semibold">
                          Coût: {request.estimatedCost} FCFA
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réparations en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {repairRequests.filter(r => r.status === 'pending' || r.status === 'diagnosed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réparations en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {repairRequests.filter(r => r.status === 'repairing').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réparations terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {repairRequests.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RepairerDashboard;
