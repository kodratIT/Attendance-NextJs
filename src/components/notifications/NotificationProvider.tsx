'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide, SlideProps } from '@mui/material';

interface NotificationContextType {
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  open: boolean;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      id,
      message,
      severity,
      open: true,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto close after 4 seconds
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, open: false } : notif
        )
      );
    }, 4000);

    // Remove from array after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 4500);
  }, []);

  const handleClose = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, open: false } : notif
      )
    );
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.open}
          onClose={() => handleClose(notification.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 8 }} // Account for top navigation
        >
          <Alert 
            onClose={() => handleClose(notification.id)} 
            severity={notification.severity}
            variant="filled"
            sx={{ minWidth: '300px' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};
