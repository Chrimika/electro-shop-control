
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Save, User, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db, doc, getDoc, updateDoc } from '@/lib/firebase';
import VendorHeader from '@/components/vendor/VendorHeader';
import { toast } from 'sonner';

const VendorProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: '',
    repairSpecialty: '',
    bio: '',
    isProfileComplete: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            displayName: data.displayName || currentUser.displayName || '',
            email: currentUser.email || '',
            phone: data.phone || '',
            repairSpecialty: data.repairSpecialty || '',
            bio: data.bio || '',
            isProfileComplete: data.isProfileComplete || false
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Impossible de charger les données du profil");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Basic validation
      if (!profileData.displayName.trim()) {
        toast.error("Le nom d'affichage est requis");
        return;
      }
      
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        phone: profileData.phone,
        repairSpecialty: profileData.repairSpecialty,
        bio: profileData.bio,
        isProfileComplete: true,
        updatedAt: new Date()
      });
      
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async () => {
    // This would require Firebase Auth password change
    // For now, just show a toast message
    toast.info("La modification du mot de passe n'est pas encore implémentée.");
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl">
                  {getInitials(profileData.displayName)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-bold">{profileData.displayName}</h2>
              <p className="text-gray-500">{profileData.email}</p>
              
              <div className="w-full mt-6">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Rôle</span>
                  <span className="font-medium">Vendeur</span>
                </div>
                
                {profileData.repairSpecialty && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Spécialité</span>
                    <span className="font-medium">{profileData.repairSpecialty}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Statut</span>
                  <span className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-green-600 font-medium">Actif</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Edit Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="general">
              <TabsList className="w-full">
                <TabsTrigger value="general" className="flex-1">Informations générales</TabsTrigger>
                <TabsTrigger value="security" className="flex-1">Sécurité</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Informations personnelles
                    </CardTitle>
                    <CardDescription>
                      Mettez à jour vos informations personnelles et professionnelles
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Nom complet</Label>
                        <Input
                          id="displayName"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                          placeholder="Votre nom complet"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profileData.email}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          placeholder="Votre numéro de téléphone"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Spécialité (si réparateur)</Label>
                        <Select 
                          value={profileData.repairSpecialty} 
                          onValueChange={(value) => setProfileData({...profileData, repairSpecialty: value})}
                        >
                          <SelectTrigger id="specialty">
                            <SelectValue placeholder="Sélectionnez une spécialité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucune</SelectItem>
                            <SelectItem value="smartphones">Smartphones</SelectItem>
                            <SelectItem value="computers">Ordinateurs</SelectItem>
                            <SelectItem value="tablets">Tablettes</SelectItem>
                            <SelectItem value="appliances">Électroménager</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biographie</Label>
                      <textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        placeholder="Quelques mots à propos de vous..."
                        className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-y"
                      ></textarea>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleProfileUpdate} disabled={loading}>
                      {loading ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2" />
                      Sécurité du compte
                    </CardTitle>
                    <CardDescription>
                      Gérez votre mot de passe et les paramètres de sécurité
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                        <p className="text-sm text-yellow-700">
                          La modification du mot de passe n'est pas encore disponible dans cette version.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end">
                    <Button onClick={handlePasswordChange} disabled={true}>
                      <Lock className="h-4 w-4 mr-2" />
                      Changer le mot de passe
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorProfile;
