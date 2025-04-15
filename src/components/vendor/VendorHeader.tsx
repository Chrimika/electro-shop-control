
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Menu, X, Home, ShoppingBag, Smartphone, Users, FileBarChart, Settings, User } from 'lucide-react';
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

const VendorHeader = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const getInitials = () => {
    if (!currentUser?.displayName) return 'V';
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
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { path: '/vendor/dashboard', label: 'Tableau de bord', icon: Home },
    { path: '/vendor/sales', label: 'Ventes', icon: ShoppingBag },
    { path: '/vendor/repairs', label: 'Réparations', icon: Smartphone },
    { path: '/vendor/customers', label: 'Clients', icon: Users },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo and title */}
        <div className="flex items-center">
          <Link to="/vendor/dashboard" className="font-bold text-xl text-purple-600 flex items-center">
            <span className="hidden sm:inline">ElectroShop Vendor</span>
            <span className="sm:hidden">ESV</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? 'secondary' : 'ghost'}
              className={`flex items-center gap-2`}
              asChild
            >
              <Link to={item.path}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
        
        {/* New sale button (always visible) */}
        <Button asChild className="hidden sm:flex" size="sm">
          <Link to="/vendor/sales/new">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Nouvelle vente
          </Link>
        </Button>

        {/* Controls (notifications and profile) */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-1 text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-auto">
                <div className="py-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p>Vous n'avez pas de nouvelles notifications</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/vendor/notifications">Voir toutes les notifications</Link>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile */}
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
                <Link to="/vendor/profile">
                  <User className="h-4 w-4 mr-2" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/vendor/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between py-4 border-b">
                  <h2 className="font-bold text-lg">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex-grow py-4 overflow-auto">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.path}
                        variant={isActive(item.path) ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to={item.path}>
                          <item.icon className="h-5 w-5 mr-3" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/vendor/profile">
                        <User className="h-5 w-5 mr-3" />
                        Mon profil
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className="border-t p-4">
                  <Button className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                    <Link to="/vendor/sales/new">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Nouvelle vente
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;
