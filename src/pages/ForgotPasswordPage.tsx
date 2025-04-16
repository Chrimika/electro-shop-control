
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const handleResetPassword = () => {
    toast.info("Veuillez vous connecter avec Google. La fonction de réinitialisation du mot de passe n'est pas disponible.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
          <CardDescription>
            Nous utilisons l'authentification Google. Veuillez vous connecter avec votre compte Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-md text-blue-700">
            ElectroShop utilise l'authentification Google pour une connexion sécurisée. 
            Il n'est pas nécessaire de réinitialiser votre mot de passe.
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResetPassword}
          >
            J'ai compris
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-gray-500">
            <Link to="/login" className="text-blue-500 hover:underline">
              Retour à la page de connexion
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
