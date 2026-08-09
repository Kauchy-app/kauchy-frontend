"use client";
import { AuthProvider } from '../context/AuthContext';
import { AuthGateProvider } from '../context/AuthGateContext';
import CompleteProfileGate from '../context/CompleteProfileGate';
import { ThemeProvider } from 'next-themes';
import { UserDataProvider } from '../context/UserDataContext';
import { NotificationProvider } from '../context/NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
                <AuthGateProvider>
                    <UserDataProvider>
                        <NotificationProvider>
                            {children}
                            <CompleteProfileGate />
                        </NotificationProvider>
                    </UserDataProvider>
                </AuthGateProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
