import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    organizationId: string;
    organizationName?: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    async function loadStoredAuth() {
        try {
            const storedAccessToken = await AsyncStorage.getItem('accessToken');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedAccessToken && storedUser) {
                setAccessToken(storedAccessToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Failed to load auth state', e);
        } finally {
            setIsLoading(false);
        }
    }

    const login = async (token: string, refresh: string, userData: User) => {
        try {
            await AsyncStorage.setItem('accessToken', token);
            await AsyncStorage.setItem('refreshToken', refresh);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setAccessToken(token);
            setUser(userData);
        } catch (e) {
            console.error('Failed to save login session', e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');

            setAccessToken(null);
            setUser(null);
        } catch (e) {
            console.error('Failed to clear login session', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
