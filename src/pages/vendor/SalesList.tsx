
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  ChevronLeft, 
  Filter, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  FileText, 
  Trash2 
} from 'lucide-react';
import VendorHeader from '@/components/vendor/VendorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db, collection, query, where, orderBy, getDocs, doc, updateDoc } from '../../lib/firebase';
import { Sale } from '../../types';
import { toast } from 'sonner';

const SalesList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  useEffect(() => {
    const fetchSales = async () => {
      if (!currentUser?.storeId) return;
      
      try {
        setLoading(true);
        
        const salesQuery = query(
          collection(db, 'sales'),
          where('storeId', '==', currentUser.storeId),
          orderBy('createdAt', 'desc')
        );
        
        const salesDocs = await getDocs(salesQuery);
        const salesData = salesDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Sale));
        
        setSales(salesData);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des ventes:', err);
        toast.error('Erreur lors du chargement des ventes');
        setLoading(false);
      }
    };
    
    fetchSales();
  }, [currentUser]);
  
  const handleCancelSale = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette vente ?')) {
      try {
        await updateDoc(doc(db, 'sales', id), {
          status: 'cancelled',
          cancellationReason: 'Annulée par le vendeur',
          cancellationDate: new Date()
        });
        
        setSales(
          sales.map(sale => 
            sale.id === id ? { ...sale, status: 'cancelled' } : sale
          )
        );
        
        toast.success('Vente annulée avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'annulation de la vente:', err);
        toast.error('Erreur lors de l\'annulation de la vente');
      }
    }
  };
  
  const filterSalesByDate = (sale: Sale): boolean => {
    const today = new Date();
    const createdAt = new Date(sale.createdAt);
    
    switch (dateFilter) {
      case 'today':
        return (
          createdAt.getDate() === today.getDate() &&
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getFullYear() === today.getFullYear()
        );
      case 'thisWeek':
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return createdAt >= weekAgo;
      case 'thisMonth':
        return (
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getFullYear() === today.getFullYear()
        );
      case 'all':
      default:
        return true;
    }
  };
  
  const filteredSales = sales.filter(sale => {
    // Text search
    const matchesSearch = 
      searchQuery === '' ||
      (sale.customer?.name && sale.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.saleType.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || sale.saleType === typeFilter;
    
    // Date filter
    const matchesDate = filterSalesByDate(sale);
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });
  
  const getSaleTypeLabel = (type: string) => {
    switch(type) {
      case 'direct':
        return 'Vente directe';
      case 'installment':
        return 'Vente en tranches';
      case 'partialPaid':
        return '80% payé';
      case 'deliveredNotPaid':
        return 'Livré non payé';
      case 'trade':
        return 'Troc';
      default:
        return type;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Complétée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2" 
              onClick={() => navigate('/vendor/dashboard')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <h1 className="text-3xl font-bold">Ventes</h1>
          </div>
          
          <Button onClick={() => navigate('/vendor/sales/new')}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle vente
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Liste des ventes</CardTitle>
            <CardDescription>Gérer les ventes de votre magasin</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher une vente..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <div className="w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="truncate">Statut</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="completed">Complétée</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-40">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="truncate">Type</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="direct">Vente directe</SelectItem>
                      <SelectItem value="installment">Vente en tranches</SelectItem>
                      <SelectItem value="partialPaid">80% payé</SelectItem>
                      <SelectItem value="deliveredNotPaid">Livré non payé</SelectItem>
                      <SelectItem value="trade">Troc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-40">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="truncate">Période</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="thisWeek">Cette semaine</SelectItem>
                      <SelectItem value="thisMonth">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune vente trouvée</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Effacer les filtres
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/vendor/sales/${sale.id}`)}>
                        <TableCell className="font-medium">{sale.id.substring(0, 6)}</TableCell>
                        <TableCell>{sale.customer?.name || 'Client anonyme'}</TableCell>
                        <TableCell>{getSaleTypeLabel(sale.saleType)}</TableCell>
                        <TableCell className="text-right">{sale.totalAmount} €</TableCell>
                        <TableCell className="text-right">{sale.paidAmount} €</TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/vendor/sales/${sale.id}`);
                              }}>
                                <Eye className="h-4 w-4 mr-2" /> Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/vendor/sales/${sale.id}/print`, '_blank');
                              }}>
                                <FileText className="h-4 w-4 mr-2" /> Imprimer
                              </DropdownMenuItem>
                              {sale.status !== 'cancelled' && sale.status !== 'completed' && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelSale(sale.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Annuler
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesList;
