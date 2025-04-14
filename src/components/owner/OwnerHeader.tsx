import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Bell, Menu, X, Home, Store, ShoppingBag, Package, Smartphone, Users, FileBarChart, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  description?: string;
};

// Configuration des éléments de navigation
const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: Home, description: 'Vue d\'ensemble de votre activité' },
  { label: 'Ventes', path: '/owner/sales', icon: ShoppingBag, description: 'Gérer et suivre toutes les ventes' },
  { label: 'Stock', path: '/owner/stock', icon: Package, description: 'Gérer votre inventaire' },
  { label: 'Boutiques', path: '/owner/stores', icon: Store, description: 'Gérer vos points de vente' },
  { label: 'Réparations', path: '/owner/repairs', icon: Smartphone, description: 'Suivre les demandes de réparation' },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Produits', path: '/owner/products', icon: Package, description: 'Gérer votre catalogue produits' },
  { label: 'Utilisateurs', path: '/owner/users', icon: Users, description: 'Gérer les comptes utilisateurs' },
  { label: 'Clients', path: '/owner/customers', icon: Users, description: 'Base de données clients' },
  { label: 'Rapports', path: '/owner/reports', icon: FileBarChart, description: 'Statistiques et analyses' },
  { label: 'Paramètres', path: '/owner/settings', icon: Settings, description: 'Configuration du système' },
];

const OwnerHeader = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const getInitials = () => {
    if (!currentUser?.displayName) return 'U';
    return currentUser.displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the auth state change if needed
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo et titre */}
        <div className="flex items-center">
          <Link to="/owner/dashboard" className="font-bold text-xl text-blue-600 flex items-center">
            <span className="hidden sm:inline">ElectroShop Control</span>
            <span className="sm:hidden">ESC</span>
          </Link>
        </div>
        
        {/* Navigation Desktop */}
        {!isMobile && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {mainNavItems.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <Link to={item.path}>
                    <NavigationMenuLink 
                      className={`${navigationMenuTriggerStyle()} ${isActive(item.path) ? 'bg-blue-100 text-blue-700' : ''}`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Plus</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {secondaryNavItems.map((item) => (
                      <li key={item.path}>
                        <Link to={item.path} className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <div className="text-sm font-medium leading-none">{item.label}</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {item.description}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}
        
        {/* Bouton de nouvelle vente (toujours visible) */}
        <Button asChild className="hidden sm:flex ml-2" size={isMobile ? "sm" : "default"}>
          <Link to="/owner/sales/new">
            <ShoppingBag className="w-4 h-4 mr-2" />
            <span>Nouvelle vente</span>
          </Link>
        </Button>

        {/* Controls (notifications et profil) */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-1 text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 border-b">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="max-h-[400px] overflow-auto">
                <div className="p-4 text-center text-sm text-gray-500">
                  Pas de nouvelles notifications
                </div>
              </div>
              <div className="p-2 border-t text-center">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/owner/notifications">Voir toutes les notifications</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Profil Utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <p>{currentUser?.displayName}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/owner/settings/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Menu mobile burger */}
          {isMobile && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between py-4 border-b">
                    <h2 className="font-bold text-lg">ElectroShop Control</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-grow overflow-auto">
                    <div className="py-2">
                      <p className="px-4 py-2 text-sm font-medium text-gray-500">Menu principal</p>
                      {mainNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center px-4 py-3 ${
                            isActive(item.path) ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    
                    <div className="py-2">
                      <p className="px-4 py-2 text-sm font-medium text-gray-500">Plus d'options</p>
                      {secondaryNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center px-4 py-3 ${
                            isActive(item.path) ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t p-4">
                    <Button asChild className="w-full">
                      <Link to="/owner/sales/new" onClick={() => setIsMobileMenuOpen(false)}>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Nouvelle vente
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default OwnerHeader;
