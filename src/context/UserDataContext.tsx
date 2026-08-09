"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

type UserDataType = {
    walletBalance: number;
    cartCount: number;
    profile: any;
    profileAvatar: string;
    refreshUserData: () => void;
} | null;

const UserDataContext = createContext<UserDataType>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [cartCount, setCartCount] = useState<number>(0);
    const [profile, setProfile] = useState<any>(null);
    const [profileAvatar, setProfileAvatar] = useState<string>('');

    const fetchAllData = useCallback(async () => {
        if (!user || !user.access) return;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.access}`
        };

        const fetchWallet = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/getbalance/`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.balance !== undefined) {
                        setWalletBalance(typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance);
                    }
                }
            } catch (error) {
                console.error("Error fetching wallet:", error);
            }
        };

        const fetchCart = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/cart-items/`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setCartCount(data?.length || 0);
                }
            } catch (error) {
                console.error("Error fetching cart:", error);
            }
        };

        const fetchProfile = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/me/`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                    setProfileAvatar(data?.profile_url || data?.pfp || '');
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        await Promise.all([fetchWallet(), fetchCart(), fetchProfile()]);
    }, [user]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return (
        <UserDataContext.Provider value={{ walletBalance, cartCount, profile, profileAvatar, refreshUserData: fetchAllData }}>
            {children}
        </UserDataContext.Provider>
    );
}

export function useUserData() {
    const ctx = useContext(UserDataContext);
    if (ctx === null) {
        return { walletBalance: 0, cartCount: 0, profile: null, profileAvatar: '', refreshUserData: () => {} };
    }
    return ctx;
}
