
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Radio, RadioGroup } from '@/components/ui/radio-group';

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'owner' | 'vendor' | 'repairer'>('owner');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return '';
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError('');
    
    try {
      await login(email, password);
      
      // La redirection sera gérée par le contexte d'authentification
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      // Friendly error messages based on error code
      if (error.code === 'auth/invalid-credential') {
        setGeneralError('Email ou mot de passe incorrect');
      } else if (error.code === 'auth/user-disabled') {
        setGeneralError('Ce compte a été désactivé');
      } else if (error.code === 'auth/user-not-found') {
        setGeneralError('Aucun compte associé à cet email');
      } else {
        setGeneralError('Échec de connexion. Vérifiez vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError('');
    
    // Validate inputs
    if (!name || name.length < 2) {
      toast.error('Veuillez entrer un nom valide');
      setGeneralError('Veuillez entrer un nom valide (minimum 2 caractères)');
      setLoading(false);
      return;
    }
    
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      toast.error(passwordValidationError);
      setGeneralError(passwordValidationError);
      setLoading(false);
      return;
    } else {
      setPasswordError('');
    }
    
    try {
      await register(email, name, password, role);
      
      // La redirection se fera via le contexte d'authentification
      // Il détectera le rôle et redirigera vers le bon tableau de bord
      
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      
      // Provide specific error messages based on Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('Cette adresse e-mail est déjà utilisée');
        toast.error('Cette adresse e-mail est déjà utilisée');
      } else if (error.code === 'auth/weak-password') {
        setGeneralError('Le mot de passe doit être plus fort (minimum 6 caractères)');
        toast.error('Le mot de passe doit être plus fort (minimum 6 caractères)');
      } else {
        setGeneralError('Échec de l\'inscription. Veuillez réessayer.');
        toast.error('Échec de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ElectroShopControl</CardTitle>
          <CardDescription className="text-center">Gestion de boutiques électroniques</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                {generalError && (
                  <div className="p-3 rounded-md bg-red-50 text-red-800 flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>{generalError}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                      Mot de passe oublié?
                    </a>
                  </div>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled={loading} className="w-full" type="submit">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4 pt-4">
                {generalError && (
                  <div className="p-3 rounded-md bg-red-50 text-red-800 flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>{generalError}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    placeholder="Votre nom" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-register">Email</Label>
                  <Input 
                    id="email-register" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Mot de passe</Label>
                  <Input 
                    id="password-register" 
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    required 
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Le mot de passe doit contenir au moins 6 caractères
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Type de compte</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as 'owner' | 'vendor' | 'repairer')}>
                    <div className="flex items-center space-x-2 mb-1">
                      <Radio value="owner" id="role-owner" />
                      <Label htmlFor="role-owner" className="cursor-pointer">Propriétaire</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Radio value="vendor" id="role-vendor" />
                      <Label htmlFor="role-vendor" className="cursor-pointer">Vendeur</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Radio value="repairer" id="role-repairer" />
                      <Label htmlFor="role-repairer" className="cursor-pointer">Réparateur</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled={loading} className="w-full" type="submit">
                  {loading ? 'Création du compte...' : 'Créer un compte'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
