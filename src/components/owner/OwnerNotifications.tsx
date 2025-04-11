
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, ShoppingBag, Store, Wrench, User } from 'lucide-react';
import { Notification } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';

interface OwnerNotificationsProps {
  notifications: Notification[];
}

const OwnerNotifications: React.FC<OwnerNotificationsProps> = ({ notifications }) => {
  const { markAllAsRead, markAsRead } = useNotifications();
  
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'sale':
        return <ShoppingBag className="h-5 w-5 text-blue-600" />;
      case 'repair':
        return <Wrench className="h-5 w-5 text-green-600" />;
      case 'inventory':
        return <Store className="h-5 w-5 text-yellow-600" />;
      case 'customer':
        return <User className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-gray-500">Restez informé des activités importantes</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          <CheckCircle className="h-4 w-4 mr-2" /> Tout marquer comme lu
        </Button>
      </div>
      
      {notifications.length === 0 ? (
        <Card className="text-center p-6">
          <CardContent className="pt-6 pb-4">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
            <p className="text-gray-500">Vous n'avez pas de notifications pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={notification.isRead ? '' : 'border-l-4 border-l-blue-500'}
            >
              <CardContent className="p-4 flex">
                <div className="mr-4 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-lg">{notification.title}</h3>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Nouveau
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                      >
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerNotifications;
