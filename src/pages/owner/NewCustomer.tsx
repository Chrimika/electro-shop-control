
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import NewCustomerForm from '@/components/owner/customers/NewCustomerForm';

const OwnerNewCustomer = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={() => navigate('/customers')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Nouveau client</h1>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <NewCustomerForm />
        </div>
      </main>
    </div>
  );
};

export default OwnerNewCustomer;
