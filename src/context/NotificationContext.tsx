"use client";
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

type Notification = {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    link?: string;
    is_read: boolean;
    created_at: string;
};

type NotificationContextType = {
    notifications: Notification[];
    unreadCount: number;
    markRead: (id: number) => void;
    markAllRead: () => void;
    deleteNotification: (id: number) => void;
    clearAll: () => void;
} | null;

const NotificationContext = createContext<NotificationContextType>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!user || !user.access) return;

        const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        const ws = new WebSocket(`${wsHost}/ws/notifications/?token=${user.access}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Notification WebSocket connected');
            ws.send(JSON.stringify({ action: 'get_notification' }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'unread_count') {
                    setUnreadCount(data.count);
                } else if (data.type === 'notifications') {
                    setNotifications(data.notifications || []);
                } else if (data.type === 'new_notification') {
                    setNotifications(prev => [data.notification, ...prev].slice(0, 20));
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };

        ws.onclose = () => {
            console.log('Notification WebSocket disconnected');
        };

        ws.onerror = (err) => {
            console.error('Notification WebSocket error:', err);
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [user?.access]);

    const markRead = useCallback((id: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'mark_read', notification_id: id }));
        }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllRead = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'mark_all_read' }));
        }
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, []);

    const deleteNotification = useCallback((id: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'delete', notification_id: id }));
        }
        setNotifications(prev => {
            const notif = prev.find(n => n.id === id);
            if (notif && !notif.is_read) {
                setUnreadCount(count => Math.max(0, count - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    const clearAll = useCallback(() => {
        notifications.forEach(n => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ action: 'delete', notification_id: n.id }));
            }
        });
        setNotifications([]);
        setUnreadCount(0);
    }, [notifications]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotification, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (ctx === null) {
        return { notifications: [], unreadCount: 0, markRead: () => {}, markAllRead: () => {}, deleteNotification: () => {}, clearAll: () => {} };
    }
    return ctx;
}
