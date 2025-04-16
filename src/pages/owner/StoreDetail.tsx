
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';

const StoreDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate('/owner/stores')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Détails de la boutique</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-500">ID: {id}</p>
              <p className="text-gray-500">Fonctionnalité en cours de développement</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StoreDetail;
