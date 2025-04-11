import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  ChevronDown, 
  LogOut, 
  Menu, 
  Wrench, 
  Settings, 
  User, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { auth, signOut } from '../../lib/firebase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const RepairerHeader = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!currentUser) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link to="/repairer/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-blue-600 mr-10">ElectroShopControl</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/repairer/dashboard" className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/repairer/repairs" className="text-gray-600 hover:text-blue-600">
                Réparations
              </Link>
              <Link to="/repairer/schedule" className="text-gray-600 hover:text-blue-600">
                Planning
              </Link>
            </nav>
          </div>
          
          {/* Right Side - User Menu & Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-lg mb-4">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucune notification</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className={`${notification.isRead ? 'bg-white' : 'bg-blue-50'} p-3 rounded-lg border`}>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/repairer/notifications" className="w-full text-center cursor-pointer">
                        Voir toutes les notifications
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{currentUser.displayName ? getInitials(currentUser.displayName) : 'R'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{currentUser.displayName || 'Réparateur'}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/repairer/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/repairer/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-blue-600">Menu</h2>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <nav className="flex flex-col space-y-6">
              <Link 
                to="/repairer/dashboard" 
                className="text-gray-600 hover:text-blue-600 text-lg font-medium"
                onClick={toggleMobileMenu}
              >
                <Wrench className="mr-2 h-5 w-5 inline" />
                Dashboard
              </Link>
              <Link 
                to="/repairer/repairs" 
                className="text-gray-600 hover:text-blue-600 text-lg font-medium"
                onClick={toggleMobileMenu}
              >
                <Wrench className="mr-2 h-5 w-5 inline" />
                Réparations
              </Link>
              <Link 
                to="/repairer/schedule" 
                className="text-gray-600 hover:text-blue-600 text-lg font-medium"
                onClick={toggleMobileMenu}
              >
                <Calendar className="mr-2 h-5 w-5 inline" />
                Planning
              </Link>
              <Link 
                to="/repairer/profile" 
                className="text-gray-600 hover:text-blue-600 text-lg font-medium"
                onClick={toggleMobileMenu}
              >
                <User className="mr-2 h-5 w-5 inline" />
                Profil
              </Link>
              <Link 
                to="/repairer/settings" 
                className="text-gray-600 hover:text-blue-600 text-lg font-medium"
                onClick={toggleMobileMenu}
              >
                <Settings className="mr-2 h-5 w-5 inline" />
                Paramètres
              </Link>
              
              <Button 
                variant="ghost" 
                className="justify-start p-0 text-lg font-medium text-red-600 hover:text-red-800"
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }}
              >
                <LogOut className="mr-2 h-5 w-5" /> Se déconnecter
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default RepairerHeader;
