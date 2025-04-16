
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CompanySetupForm from '@/components/owner/CompanySetupForm';
import OwnerHeader from '@/components/owner/OwnerHeader';

const CompanySetupPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Bienvenue sur ElectroShop</h1>
          <p className="text-lg mb-8 text-center text-gray-600">
            Commençons par configurer votre entreprise pour personnaliser votre expérience
          </p>
          <CompanySetupForm />
        </div>
      </main>
    </div>
  );
};

export default CompanySetupPage;
