
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, FileBarChart2, TrendingUp } from 'lucide-react';

// Données factices pour les graphiques
const salesData = [
  { name: 'Jan', ventes: 4000, reparations: 2400, montant: 2400 },
  { name: 'Fév', ventes: 3000, reparations: 1398, montant: 2210 },
  { name: 'Mar', ventes: 2000, reparations: 9800, montant: 2290 },
  { name: 'Avr', ventes: 2780, reparations: 3908, montant: 2000 },
  { name: 'Mai', ventes: 1890, reparations: 4800, montant: 2181 },
  { name: 'Juin', ventes: 2390, reparations: 3800, montant: 2500 },
  { name: 'Juil', ventes: 3490, reparations: 4300, montant: 2100 },
];

const storePerformanceData = [
  { name: 'Boutique 1', ventes: 4000, montant: 24000 },
  { name: 'Boutique 2', ventes: 3000, montant: 18000 },
  { name: 'Boutique 3', ventes: 2000, montant: 12000 },
  { name: 'Boutique 4', ventes: 2780, montant: 16500 },
  { name: 'Boutique 5', ventes: 1890, montant: 11000 },
];

const OwnerStats = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Statistiques</h2>
          <p className="text-gray-500">Analysez les performances de votre entreprise</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Période
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileBarChart2 className="h-4 w-4" /> Rapport
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Exporter
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overall" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overall">Vue globale</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="stores">Boutiques</TabsTrigger>
          <TabsTrigger value="repairs">Réparations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overall">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" /> 
                  Évolution des ventes
                </CardTitle>
                <CardDescription>Volume des ventes sur les 7 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ventes" stroke="#3b82f6" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="montant" stroke="#10b981" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" /> 
                  Performance par boutique
                </CardTitle>
                <CardDescription>Comparaison des performances entre boutiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={storePerformanceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ventes" fill="#3b82f6" />
                      <Bar dataKey="montant" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Analyse détaillée des ventes</CardTitle>
              <CardDescription>Statistiques complètes sur toutes les ventes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Contenu détaillé des statistiques de vente à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Performance des boutiques</CardTitle>
              <CardDescription>Analyse comparative entre les boutiques</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Contenu détaillé des statistiques par boutique à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="repairs">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des réparations</CardTitle>
              <CardDescription>Analyse des réparations par type et durée</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Contenu détaillé des statistiques de réparation à implémenter</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerStats;
