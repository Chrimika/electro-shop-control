
import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, collection, onSnapshot, query, where, orderBy } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  isRead: boolean;
  recipientId: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to notifications in real-time
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Show toast for new notifications
        if (!data.isRead && !notifications.some(n => n.id === doc.id)) {
          toast(data.title, {
            description: data.message,
          });
        }
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          createdAt: data.createdAt.toDate(),
          isRead: data.isRead,
          recipientId: data.recipientId,
        };
      });

      setNotifications(notificationsData);
    });

    return unsubscribe;
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    // Implementation will be added later
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    // Implementation will be added later
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
