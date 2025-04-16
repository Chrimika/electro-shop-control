
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login, setUserRole, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'owner' | 'vendor'>('owner');
  const [error, setError] = useState<string | null>(null);
  
  const handleRegister = async () => {
    setError(null);
    try {
      // First login with Google
      await login();
      
      // Then set the user role
      await setUserRole(selectedRole);
      
      // Redirect based on role
      if (selectedRole === 'owner') {
        navigate('/owner/setup');
      } else {
        navigate('/vendor/dashboard');
      }
      
      toast.success(`Compte créé avec succès en tant que ${selectedRole === 'owner' ? 'propriétaire' : 'vendeur'}`);
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite lors de l'inscription");
      toast.error("Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour commencer à utiliser ElectroShop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 p-3 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Je suis:</h3>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => setSelectedRole(value as 'owner' | 'vendor')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Propriétaire d'entreprise</SelectItem>
                <SelectItem value="vendor">Vendeur</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-500 mt-1">
              {selectedRole === 'owner' ? (
                "En tant que propriétaire, vous pourrez gérer des boutiques, des produits et des vendeurs"
              ) : (
                "En tant que vendeur, vous pourrez effectuer des ventes et gérer votre stock"
              )}
            </div>
          </div>
          
          <Button 
            className="w-full flex items-center justify-center gap-2" 
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>S'inscrire avec Google</span>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-gray-500">
            Vous avez déjà un compte?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
