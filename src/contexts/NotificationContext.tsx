
import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, collection, onSnapshot, query, where, orderBy, doc, updateDoc, deleteDoc, Timestamp, addDoc } from '../lib/firebase';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Partial<Notification>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  addNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(notification => !notification.isRead).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, {
        isRead: true
      });
      
      // Update local state
      setNotifications(
        notifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erreur lors de la mise à jour de la notification');
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    try {
      // Update all unread notifications
      const promises = notifications
        .filter(n => !n.isRead)
        .map(n => {
          const notificationRef = doc(db, 'notifications', n.id);
          return updateDoc(notificationRef, { isRead: true });
        });
      
      await Promise.all(promises);
      
      // Update local state
      setNotifications(
        notifications.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erreur lors de la mise à jour des notifications');
    }
  };
  
  const deleteNotification = async (id: string) => {
    if (!currentUser) return;
    
    try {
      await deleteDoc(doc(db, 'notifications', id));
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== id
      );
      setNotifications(updatedNotifications);
      
      // Update unread count if deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      toast.success('Notification supprimée');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression de la notification');
    }
  };
  
  const addNotification = async (notificationData: Partial<Notification>) => {
    if (!currentUser) return;
    
    try {
      const newNotification = {
        recipientId: currentUser.id,
        title: notificationData.title || 'Nouvelle notification',
        message: notificationData.message || '',
        type: notificationData.type || 'system',
        createdAt: Timestamp.now(),
        isRead: false,
        relatedId: notificationData.relatedId
      };
      
      await addDoc(collection(db, 'notifications'), newNotification);
      toast.success('Notification créée');
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Erreur lors de la création de la notification');
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
