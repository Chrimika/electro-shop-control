
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Upload, ChevronRight, Loader2 } from 'lucide-react';
import { CompanyInfo } from '@/types/company';
import { db, storage, doc, setDoc, ref, uploadBytes, getDownloadURL } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const activityDomains = [
  "Électronique & Télécommunications",
  "Informatique & Services numériques",
  "Commerce de détail",
  "Restauration & Alimentation",
  "Beauté & Bien-être",
  "Santé & Médical",
  "Mode & Vêtements",
  "Automobile & Transport",
  "Éducation & Formation",
  "Bâtiment & Construction",
  "Autre"
];

const CompanySetupForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [companyData, setCompanyData] = useState<CompanyInfo>({
    name: '',
    activityDomain: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
    commercialRegisterNumber: '',
    address: '',
    primaryColor: '#3b82f6', // Bleu par défaut
    setupCompleted: false
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async () => {
    if (!currentUser) return;
    
    try {
      setIsSubmitting(true);
      
      let logoUrl = '';
      if (logoFile) {
        const storageRef = ref(storage, `companies/${currentUser.id}/logo`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }
      
      const finalCompanyData: CompanyInfo = {
        ...companyData,
        logo: logoUrl || undefined,
        setupCompleted: true
      };
      
      // Sauvegarder les données de l'entreprise
      await setDoc(doc(db, 'companies', currentUser.id), finalCompanyData);
      
      // Mettre à jour le document utilisateur pour indiquer que la configuration est terminée
      await setDoc(doc(db, 'users', currentUser.id), { 
        hasCompletedSetup: true 
      }, { merge: true });
      
      toast({
        title: "Configuration terminée",
        description: "Les informations de votre entreprise ont été enregistrées avec succès.",
        duration: 5000,
      });
      
      // Rediriger vers le tableau de bord
      navigate('/owner/dashboard');
      
    } catch (error) {
      console.error("Erreur lors de la configuration de l'entreprise:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement des informations.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const renderStep1 = () => (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Informations de base</CardTitle>
        <CardDescription>
          Commençons par les informations essentielles de votre entreprise
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">Logo de l'entreprise</Label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50 relative">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-2" />
              ) : (
                <Building2 className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <Input 
                id="logo" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500 mt-1">Format recommandé: PNG ou JPG, 512x512px</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Nom de l'entreprise *</Label>
          <Input 
            id="name" 
            name="name" 
            value={companyData.name} 
            onChange={handleInputChange} 
            placeholder="Nom de votre entreprise"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="activityDomain">Domaine d'activité *</Label>
          <Select 
            value={companyData.activityDomain} 
            onValueChange={(value) => handleSelectChange('activityDomain', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre domaine d'activité" />
            </SelectTrigger>
            <SelectContent>
              {activityDomains.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {companyData.activityDomain === 'Autre' && (
            <Input 
              className="mt-2"
              name="activityDomain" 
              value={companyData.activityDomain === 'Autre' ? '' : companyData.activityDomain} 
              onChange={handleInputChange} 
              placeholder="Précisez votre domaine d'activité"
            />
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => navigate('/owner/dashboard')}>
          Faire plus tard
        </Button>
        <Button onClick={nextStep} disabled={!companyData.name || !companyData.activityDomain}>
          Suivant <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </>
  );
  
  const renderStep2 = () => (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Coordonnées de contact</CardTitle>
        <CardDescription>
          Comment vos clients peuvent vous contacter
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input 
            id="phone" 
            name="phone" 
            value={companyData.phone} 
            onChange={handleInputChange} 
            placeholder="+33 6 XX XX XX XX"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel *</Label>
          <Input 
            id="email" 
            name="email" 
            type="email"
            value={companyData.email} 
            onChange={handleInputChange} 
            placeholder="contact@votre-entreprise.com"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="website">Site web (optionnel)</Label>
          <Input 
            id="website" 
            name="website" 
            value={companyData.website} 
            onChange={handleInputChange} 
            placeholder="https://www.votre-entreprise.com" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Adresse complète *</Label>
          <Input 
            id="address" 
            name="address" 
            value={companyData.address} 
            onChange={handleInputChange} 
            placeholder="123 rue de la Paix, 75000 Paris"
            required 
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Retour
        </Button>
        <Button 
          onClick={nextStep} 
          disabled={!companyData.phone || !companyData.email || !companyData.address}
        >
          Suivant <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </>
  );
  
  const renderStep3 = () => (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Informations légales et personnalisation</CardTitle>
        <CardDescription>
          Finalisons la configuration de votre entreprise
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="taxNumber">Numéro de contribuable *</Label>
          <Input 
            id="taxNumber" 
            name="taxNumber" 
            value={companyData.taxNumber} 
            onChange={handleInputChange} 
            placeholder="FR12345678900"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="commercialRegisterNumber">Numéro de registre du commerce *</Label>
          <Input 
            id="commercialRegisterNumber" 
            name="commercialRegisterNumber" 
            value={companyData.commercialRegisterNumber} 
            onChange={handleInputChange} 
            placeholder="RCS PARIS B 123 456 789"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Couleur principale</Label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              id="primaryColor"
              name="primaryColor"
              value={companyData.primaryColor}
              onChange={handleInputChange}
              className="h-10 w-10 rounded-md cursor-pointer"
            />
            <Input 
              value={companyData.primaryColor} 
              onChange={handleInputChange} 
              name="primaryColor"
              className="w-32"
              placeholder="#3b82f6" 
            />
            <p className="text-sm text-gray-500">
              Cette couleur sera utilisée dans votre interface et vos documents
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Retour
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !companyData.taxNumber || !companyData.commercialRegisterNumber}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Enregistrement...
            </>
          ) : (
            "Terminer la configuration"
          )}
        </Button>
      </CardFooter>
    </>
  );
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="border-b px-6 py-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Configuration de votre entreprise</h2>
          <div className="flex items-center gap-1 text-sm">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div 
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center
                    ${currentStep === step ? 'bg-primary text-white' : 
                      currentStep > step ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'}
                  `}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-6 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </Card>
  );
};

export default CompanySetupForm;
